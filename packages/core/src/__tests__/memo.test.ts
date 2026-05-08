import { describe, expect, it } from "vitest";
import { generateMemo, generatePaymentId } from "../payment/memo.js";

describe("generateMemo", () => {
	it("returns a 20-character hex string", () => {
		const memo = generateMemo();
		expect(memo).toHaveLength(20);
		expect(memo).toMatch(/^[0-9a-f]{20}$/);
	});

	it("generates unique values", () => {
		const memos = new Set(Array.from({ length: 100 }, () => generateMemo()));
		expect(memos.size).toBe(100);
	});
});

describe("generatePaymentId", () => {
	it("starts with jp_ prefix", () => {
		const id = generatePaymentId();
		expect(id).toMatch(/^jp_[0-9a-f]{16}$/);
	});

	it("generates unique values", () => {
		const ids = new Set(Array.from({ length: 100 }, () => generatePaymentId()));
		expect(ids.size).toBe(100);
	});
});
