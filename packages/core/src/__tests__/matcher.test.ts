import { describe, expect, it } from "vitest";
import type { HorizonPaymentRecord } from "../payment/matcher.js";
import { matchPayment } from "../payment/matcher.js";
import type { PaymentRequest } from "../payment/types.js";

function makeRequest(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
	return {
		id: "jp_test123",
		memo: "abcdef1234567890abcd",
		sep7Uri: "web+stellar:pay?...",
		amount: "10.00",
		currency: "USDC",
		destination: "GBCXQUEPSEGIKXLYOIF6E4P5PZYXHIP4SIPTSLJNPBFLWG7IIUAO2GCJ",
		status: "pending",
		createdAt: new Date().toISOString(),
		expiresAt: new Date(Date.now() + 300_000).toISOString(),
		...overrides,
	};
}

function makeRecord(overrides: Partial<HorizonPaymentRecord> = {}): HorizonPaymentRecord {
	return {
		transactionHash: "tx_hash_123",
		from: "GSENDER...",
		to: "GBCXQUEPSEGIKXLYOIF6E4P5PZYXHIP4SIPTSLJNPBFLWG7IIUAO2GCJ",
		amount: "10.00",
		assetCode: "USDC",
		ledger: 12345,
		createdAt: new Date().toISOString(),
		...overrides,
	};
}

describe("matchPayment", () => {
	it("matches by memo text", () => {
		const request = makeRequest({ memo: "testmemo123" });
		const pending = new Map([[request.id, request]]);

		const record = makeRecord({ memo: "testmemo123", memoType: "text" });
		const result = matchPayment(record, pending);

		expect(result).not.toBeNull();
		expect(result?.request.id).toBe(request.id);
		expect(result?.receipt.transactionHash).toBe("tx_hash_123");
	});

	it("does not match non-pending requests", () => {
		const request = makeRequest({ memo: "testmemo123", status: "confirmed" });
		const pending = new Map([[request.id, request]]);

		const record = makeRecord({ memo: "testmemo123", memoType: "text" });
		const result = matchPayment(record, pending);

		expect(result).toBeNull();
	});

	it("falls back to amount+asset matching within time window", () => {
		const now = new Date();
		const request = makeRequest({ memo: "different_memo", createdAt: now.toISOString() });
		const pending = new Map([[request.id, request]]);

		const record = makeRecord({
			amount: "10.00",
			assetCode: "USDC",
			createdAt: new Date(now.getTime() + 5_000).toISOString(),
		});
		const result = matchPayment(record, pending);

		expect(result).not.toBeNull();
		expect(result?.request.id).toBe(request.id);
	});

	it("does not fallback match outside time window", () => {
		const now = new Date();
		const request = makeRequest({
			memo: "different_memo",
			createdAt: new Date(now.getTime() - 120_000).toISOString(),
		});
		const pending = new Map([[request.id, request]]);

		const record = makeRecord({
			amount: "10.00",
			assetCode: "USDC",
			createdAt: now.toISOString(),
		});
		const result = matchPayment(record, pending);

		expect(result).toBeNull();
	});

	it("normalizes native asset to XLM", () => {
		const request = makeRequest({ currency: "XLM", memo: "diff" });
		const pending = new Map([[request.id, request]]);

		const record = makeRecord({
			amount: request.amount,
			assetCode: "native",
			createdAt: request.createdAt,
		});
		const result = matchPayment(record, pending);

		expect(result).not.toBeNull();
	});

	it("returns null when no requests match", () => {
		const pending = new Map<string, PaymentRequest>();
		const record = makeRecord();
		const result = matchPayment(record, pending);

		expect(result).toBeNull();
	});
});
