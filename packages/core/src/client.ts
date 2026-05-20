import EventEmitter from "eventemitter3";
import { type JupayConfig, type NetworkConfig, createHorizonServer, resolveNetwork } from "./config.js";
import { InvalidConfigError, PaymentExpiredError, PaymentNotFoundError } from "./errors.js";
import { type HorizonPaymentRecord, matchPayment } from "./payment/matcher.js";
import { createPaymentRequest } from "./payment/request.js";
import type {
	PaymentConfirmedCallback,
	PaymentExpiredCallback,
	PaymentReceipt,
	PaymentRequest,
	PaymentRequestParams,
} from "./payment/types.js";
import { HorizonPaymentStream } from "./streaming/horizon-stream.js";
import { resolveMemo } from "./streaming/memo-resolver.js";

export interface ClientEvents {
	"payment:confirmed": (receipt: PaymentReceipt) => void;
	"payment:expired": (paymentId: string) => void;
	error: (error: Error) => void;
	ready: () => void;
}

/**
 * Main entry point for Jupay SDK.
 *
 * @example
 * ```ts
 * const jupay = new JupayClient({
 *   merchantAddress: 'G...',
 *   network: 'testnet',
 * });
 *
 * const payment = await jupay.createPayment({
 *   amount: '10.00',
 *   currency: 'USDC',
 *   reference: 'order-123',
 * });
 *
 * jupay.onConfirmed(payment.id, (receipt) => {
 *   console.log('Paid!', receipt.transactionHash);
 * });
 * ```
 */
export class JupayClient extends EventEmitter<ClientEvents> {
	private readonly config: JupayConfig;
	private readonly networkConfig: NetworkConfig;
	private readonly pendingPayments = new Map<string, PaymentRequest>();
	private readonly confirmCallbacks = new Map<string, PaymentConfirmedCallback>();
	private readonly expireCallbacks = new Map<string, PaymentExpiredCallback>();
	private readonly expirationTimers = new Map<string, ReturnType<typeof setTimeout>>();
	private stream: HorizonPaymentStream | null = null;
	private started = false;

	constructor(config: JupayConfig) {
		super();
		this.validateConfig(config);
		this.config = {
			...config,
			acceptedAssets: config.acceptedAssets ?? ["USDC", "XLM"],
		};
		this.networkConfig = resolveNetwork(config.network);
	}

	/**
	 * Create a new payment request.
	 * Starts the payment stream automatically on first call.
	 */
	async createPayment(params: PaymentRequestParams): Promise<PaymentRequest> {
		const accepted = this.config.acceptedAssets ?? ["USDC", "XLM"];
		if (!accepted.includes(params.currency.toUpperCase())) {
			throw new InvalidConfigError(
				`Asset "${params.currency}" is not in accepted assets: ${accepted.join(", ")}`,
			);
		}

		const request = createPaymentRequest(params, this.config);
		this.pendingPayments.set(request.id, request);
		this.scheduleExpiration(request);

		if (!this.started) {
			this.startStream();
		}

		return request;
	}

	/**
	 * Register a callback for when a specific payment is confirmed.
	 */
	onConfirmed(paymentId: string, callback: PaymentConfirmedCallback): void {
		const request = this.pendingPayments.get(paymentId);
		if (!request) {
			throw new PaymentNotFoundError(paymentId);
		}
		if (request.status === "expired") {
			throw new PaymentExpiredError(paymentId);
		}
		this.confirmCallbacks.set(paymentId, callback);
	}

	/**
	 * Register a callback for when a specific payment expires.
	 */
	onExpired(paymentId: string, callback: PaymentExpiredCallback): void {
		const request = this.pendingPayments.get(paymentId);
		if (!request) {
			throw new PaymentNotFoundError(paymentId);
		}
		this.expireCallbacks.set(paymentId, callback);
	}

	/**
	 * Get a payment request by ID.
	 */
	getPayment(paymentId: string): PaymentRequest | undefined {
		return this.pendingPayments.get(paymentId);
	}

	/**
	 * Cancel a pending payment request.
	 */
	cancelPayment(paymentId: string): void {
		const request = this.pendingPayments.get(paymentId);
		if (!request) {
			throw new PaymentNotFoundError(paymentId);
		}
		request.status = "failed";
		this.cleanup(paymentId);
	}

	/**
	 * Stop the payment stream and clean up all resources.
	 */
	destroy(): void {
		if (this.stream) {
			this.stream.stop();
			this.stream = null;
		}
		for (const timer of this.expirationTimers.values()) {
			clearTimeout(timer);
		}
		this.expirationTimers.clear();
		this.pendingPayments.clear();
		this.confirmCallbacks.clear();
		this.expireCallbacks.clear();
		this.started = false;
		this.removeAllListeners();
	}

	private startStream(): void {
		const server = createHorizonServer(this.networkConfig);
		this.stream = new HorizonPaymentStream(server, this.config.merchantAddress);

		this.stream.on("payment", (record) => {
			void this.handlePayment(record, server);
		});

		this.stream.on("error", (error) => {
			this.emit("error", error);
		});

		this.stream.on("connected", () => {
			this.emit("ready");
		});

		this.stream.start();
		this.started = true;
	}

	private async handlePayment(
		record: HorizonPaymentRecord,
		server: import("@stellar/stellar-sdk").Horizon.Server,
	): Promise<void> {
		// Resolve memo from the parent transaction
		const { memo, memoType } = await resolveMemo(server, record.transactionHash);
		const enrichedRecord = { ...record, memo, memoType };

		const match = matchPayment(enrichedRecord, this.pendingPayments);
		if (!match) return;

		const { request, receipt } = match;
		request.status = "confirmed";

		// Fire specific callback
		const callback = this.confirmCallbacks.get(request.id);
		if (callback) {
			callback(receipt);
		}

		// Fire global event
		this.emit("payment:confirmed", receipt);

		this.cleanup(request.id);
	}

	private scheduleExpiration(request: PaymentRequest): void {
		const expiresAt = new Date(request.expiresAt).getTime();
		const delay = expiresAt - Date.now();

		if (delay <= 0) {
			request.status = "expired";
			return;
		}

		const timer = setTimeout(() => {
			request.status = "expired";

			const callback = this.expireCallbacks.get(request.id);
			if (callback) {
				callback(request.id);
			}

			this.emit("payment:expired", request.id);
			this.cleanup(request.id);
		}, delay);

		this.expirationTimers.set(request.id, timer);
	}

	private cleanup(paymentId: string): void {
		const timer = this.expirationTimers.get(paymentId);
		if (timer) {
			clearTimeout(timer);
			this.expirationTimers.delete(paymentId);
		}
		this.confirmCallbacks.delete(paymentId);
		this.expireCallbacks.delete(paymentId);
	}

	private validateConfig(config: JupayConfig): void {
		if (!config.merchantAddress) {
			throw new InvalidConfigError("merchantAddress is required");
		}
		if (!config.merchantAddress.startsWith("G") || config.merchantAddress.length !== 56) {
			throw new InvalidConfigError(
				"merchantAddress must be a valid Stellar public key (starts with G, 56 characters)",
			);
		}
		if (!config.network) {
			throw new InvalidConfigError("network is required");
		}
	}
}
