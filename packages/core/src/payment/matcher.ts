import type { PaymentReceipt, PaymentRequest } from "./types.js";

/**
 * Match an incoming Horizon payment record to a pending payment request.
 * Primary matching is by memo text. Fallback matches by amount+asset
 * within a 60-second window.
 */
export function matchPayment(
	record: HorizonPaymentRecord,
	pendingRequests: Map<string, PaymentRequest>,
): { request: PaymentRequest; receipt: PaymentReceipt } | null {
	// Primary: match by memo
	for (const request of pendingRequests.values()) {
		if (request.status !== "pending") continue;

		if (record.memo === request.memo && record.memoType === "text") {
			return {
				request,
				receipt: buildReceipt(request, record),
			};
		}
	}

	// Fallback: match by exact amount + asset within time window
	for (const request of pendingRequests.values()) {
		if (request.status !== "pending") continue;

		const timeDiff = Math.abs(
			new Date(record.createdAt).getTime() - new Date(request.createdAt).getTime(),
		);

		if (
			record.amount === request.amount &&
			normalizeAsset(record.assetCode) === normalizeAsset(request.currency) &&
			timeDiff < 60_000
		) {
			return {
				request,
				receipt: buildReceipt(request, record),
			};
		}
	}

	return null;
}

function buildReceipt(request: PaymentRequest, record: HorizonPaymentRecord): PaymentReceipt {
	return {
		paymentId: request.id,
		transactionHash: record.transactionHash,
		from: record.from,
		amount: record.amount,
		asset: record.assetCode,
		ledger: record.ledger,
		confirmedAt: new Date().toISOString(),
	};
}

function normalizeAsset(asset: string): string {
	return asset.toUpperCase() === "NATIVE" ? "XLM" : asset.toUpperCase();
}

export interface HorizonPaymentRecord {
	transactionHash: string;
	from: string;
	to: string;
	amount: string;
	assetCode: string;
	assetIssuer?: string;
	memo?: string;
	memoType?: string;
	ledger: number;
	createdAt: string;
}
