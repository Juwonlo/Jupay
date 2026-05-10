import { describe, expect, it } from "vitest";
import { USDC_ISSUER } from "../config.js";
import { buildSep7Uri } from "../payment/sep7-uri.js";

describe("buildSep7Uri", () => {
	const destination = "GBCXQUEPSEGIKXLYOIF6E4P5PZYXHIP4SIPTSLJNPBFLWG7IIUAO2GCJ";

	it("builds a valid USDC payment URI", () => {
		const uri = buildSep7Uri({
			destination,
			amount: "10.00",
			assetCode: "USDC",
			memo: "abc123",
		});

		expect(uri).toContain("web+stellar:pay?");
		expect(uri).toContain(`destination=${destination}`);
		expect(uri).toContain("amount=10.00");
		expect(uri).toContain("asset_code=USDC");
		expect(uri).toContain(`asset_issuer=${USDC_ISSUER}`);
		expect(uri).toContain("memo=abc123");
		expect(uri).toContain("memo_type=MEMO_TEXT");
	});

	it("builds a valid XLM payment URI with native asset", () => {
		const uri = buildSep7Uri({
			destination,
			amount: "50.00",
			assetCode: "XLM",
			memo: "def456",
		});

		expect(uri).toContain("asset_code=native");
		expect(uri).not.toContain("asset_issuer");
	});

	it("handles case-insensitive asset codes", () => {
		const uri = buildSep7Uri({
			destination,
			amount: "5.00",
			assetCode: "usdc",
			memo: "test",
		});

		expect(uri).toContain("asset_code=USDC");
	});

	it("throws for unknown non-XLM assets", () => {
		expect(() =>
			buildSep7Uri({
				destination,
				amount: "1.00",
				assetCode: "UNKNOWN",
				memo: "test",
			}),
		).toThrow('Unknown asset issuer for "UNKNOWN"');
	});
});
