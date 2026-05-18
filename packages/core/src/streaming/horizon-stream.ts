import type { Horizon } from "@stellar/stellar-sdk";
import EventEmitter from "eventemitter3";
import type { HorizonPaymentRecord } from "../payment/matcher.js";

export interface StreamEvents {
	payment: (record: HorizonPaymentRecord) => void;
	error: (error: Error) => void;
	connected: () => void;
}

/**
 * Manages an SSE connection to Horizon's payment stream for a given account.
 * Auto-reconnects on failure with exponential backoff.
 */
export class HorizonPaymentStream extends EventEmitter<StreamEvents> {
	private closeStream: (() => void) | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private readonly server: Horizon.Server,
		private readonly accountId: string,
	) {
		super();
	}

	start(): void {
		this.connect();
	}

	stop(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.closeStream) {
			this.closeStream();
			this.closeStream = null;
		}
		this.removeAllListeners();
	}

	private connect(): void {
		try {
			this.closeStream = this.server
				.payments()
				.forAccount(this.accountId)
				.cursor("now")
				.stream({
					onmessage: (record: Horizon.ServerApi.PaymentOperationRecord) => {
						this.reconnectAttempts = 0;
						const parsed = this.parseRecord(record);
						if (parsed) {
							this.emit("payment", parsed);
						}
					},
					onerror: (error: unknown) => {
						this.emit("error", error instanceof Error ? error : new Error(String(error)));
						this.scheduleReconnect();
					},
				}) as unknown as () => void;

			this.emit("connected");
		} catch (error) {
			this.emit("error", error instanceof Error ? error : new Error(String(error)));
			this.scheduleReconnect();
		}
	}

	private scheduleReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			this.emit("error", new Error("Max reconnect attempts reached"));
			return;
		}

		const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
		this.reconnectAttempts++;

		this.reconnectTimer = setTimeout(() => {
			this.connect();
		}, delay);
	}

	private parseRecord(record: Horizon.ServerApi.PaymentOperationRecord): HorizonPaymentRecord | null {
		// Only handle payment and pathPayment operations
		const type = record.type;
		if (type !== "payment" && type !== "path_payment_strict_receive" && type !== "path_payment_strict_send") {
			return null;
		}

		// Only payments TO our account
		if (record.to !== this.accountId) {
			return null;
		}

		const assetCode = record.asset_type === "native" ? "XLM" : (record.asset_code ?? "unknown");

		return {
			transactionHash: record.transaction_hash,
			from: record.from,
			to: record.to,
			amount: record.amount,
			assetCode,
			assetIssuer: record.asset_type === "native" ? undefined : record.asset_issuer,
			ledger: record.transaction?.ledger_attr as unknown as number ?? 0,
			createdAt: record.created_at,
		};
	}
}
