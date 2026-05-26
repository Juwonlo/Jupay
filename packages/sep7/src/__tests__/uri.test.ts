import { describe, expect, it } from "vitest";
import { buildPayUri, parseSep7Uri } from "../uri.js";

const DEST = "GBCXQUEPSEGIKXLYOIF6E4P5PZYXHIP4SIPTSLJNPBFLWG7IIUAO2GCJ";

describe("buildPayUri", () => {
	it("builds USDC payment URI with auto-resolved issuer", () => {
		const uri = buildPayUri({
			destination: DEST,
			amount: "25.50",
			assetCode: "USDC",
			memo: "order-456",
		});

		expect(uri).toContain("web+stellar:pay?");
		expect(uri).toContain(`destination=${DEST}`);
		expect(uri).toContain("amount=25.50");
		expect(uri).toContain("asset_code=USDC");
		expect(uri).toContain("asset_issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN");
		expect(uri).toContain("memo=order-456");
		expect(uri).toContain("memo_type=MEMO_TEXT");
	});

	it("builds XLM payment URI with native asset", () => {
		const uri = buildPayUri({
			destination: DEST,
			amount: "100",
			assetCode: "XLM",
		});

		expect(uri).toContain("asset_code=native");
		expect(uri).not.toContain("asset_issuer");
		expect(uri).not.toContain("memo=");
	});

	it("includes optional msg and originDomain", () => {
		const uri = buildPayUri({
			destination: DEST,
			amount: "10.00",
			assetCode: "USDC",
			msg: "Payment for coffee",
			originDomain: "example.com",
		});

		expect(uri).toContain("msg=Payment+for+coffee");
		expect(uri).toContain("origin_domain=example.com");
	});

	it("accepts custom asset issuer", () => {
		const uri = buildPayUri({
			destination: DEST,
			amount: "1.00",
			assetCode: "CUSTOM",
			assetIssuer: "GCUSTOM_ISSUER_ADDRESS_PLACEHOLDER_56CHARS_PADDING",
		});

		expect(uri).toContain("asset_code=CUSTOM");
		expect(uri).toContain("asset_issuer=GCUSTOM_ISSUER_ADDRESS_PLACEHOLDER_56CHARS_PADDING");
	});

	it("throws for unknown asset without issuer", () => {
		expect(() =>
			buildPayUri({ destination: DEST, amount: "1.00", assetCode: "UNKNOWN" }),
		).toThrow('No issuer known for asset "UNKNOWN"');
	});
});

describe("parseSep7Uri", () => {
	it("round-trips a USDC URI", () => {
		const original = {
			destination: DEST,
			amount: "25.50",
			assetCode: "USDC",
			memo: "order-456",
		};

		const uri = buildPayUri(original);
		const parsed = parseSep7Uri(uri);

		expect(parsed.destination).toBe(DEST);
		expect(parsed.amount).toBe("25.50");
		expect(parsed.assetCode).toBe("USDC");
		expect(parsed.memo).toBe("order-456");
		expect(parsed.memoType).toBe("MEMO_TEXT");
	});

	it("round-trips an XLM URI", () => {
		const uri = buildPayUri({
			destination: DEST,
			amount: "100",
			assetCode: "XLM",
		});

		const parsed = parseSep7Uri(uri);
		expect(parsed.assetCode).toBe("XLM");
	});

	it("throws on invalid URI prefix", () => {
		expect(() => parseSep7Uri("https://example.com")).toThrow("Invalid SEP-7 URI");
	});

	it("throws on missing destination", () => {
		expect(() => parseSep7Uri("web+stellar:pay?amount=10")).toThrow("missing destination");
	});
});
