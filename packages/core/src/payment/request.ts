import type { JupayConfig } from "../config.js";
import { generateMemo, generatePaymentId } from "./memo.js";
import { buildSep7Uri } from "./sep7-uri.js";
import type { PaymentRequest, PaymentRequestParams } from "./types.js";

const DEFAULT_EXPIRY_SECONDS = 300;

export function createPaymentRequest(
	params: PaymentRequestParams,
	config: JupayConfig,
): PaymentRequest {
	const id = generatePaymentId();
	const memo = generateMemo();
	const expiresIn = params.expiresIn ?? DEFAULT_EXPIRY_SECONDS;
	const now = new Date();
	const expiresAt = new Date(now.getTime() + expiresIn * 1000);

	const sep7Uri = buildSep7Uri({
		destination: config.merchantAddress,
		amount: params.amount,
		assetCode: params.currency,
		memo,
	});

	return {
		id,
		memo,
		sep7Uri,
		amount: params.amount,
		currency: params.currency,
		reference: params.reference,
		destination: config.merchantAddress,
		status: "pending",
		createdAt: now.toISOString(),
		expiresAt: expiresAt.toISOString(),
	};
}
