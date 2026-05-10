import { USDC_ISSUER } from "../config.js";

export interface Sep7Params {
	destination: string;
	amount: string;
	assetCode: string;
	memo: string;
}

/**
 * Build a SEP-7 `web+stellar:pay` URI.
 *
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md
 */
export function buildSep7Uri(params: Sep7Params): string {
	const { destination, amount, assetCode, memo } = params;

	const queryParams = new URLSearchParams();
	queryParams.set("destination", destination);
	queryParams.set("amount", amount);

	if (assetCode.toUpperCase() === "XLM") {
		queryParams.set("asset_code", "native");
	} else {
		queryParams.set("asset_code", assetCode.toUpperCase());
		queryParams.set("asset_issuer", resolveIssuer(assetCode));
	}

	queryParams.set("memo", memo);
	queryParams.set("memo_type", "MEMO_TEXT");

	return `web+stellar:pay?${queryParams.toString()}`;
}

function resolveIssuer(assetCode: string): string {
	if (assetCode.toUpperCase() === "USDC") {
		return USDC_ISSUER;
	}
	throw new Error(
		`Unknown asset issuer for "${assetCode}". For custom assets, use the full @jupay/sep7 package.`,
	);
}
