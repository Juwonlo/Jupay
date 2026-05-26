/** Well-known USDC issuer on Stellar mainnet (Circle) */
const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

/** Known asset issuers for common Stellar assets */
const KNOWN_ISSUERS: Record<string, string> = {
	USDC: USDC_ISSUER,
};

export interface Sep7PayParams {
	/** Destination Stellar address */
	destination: string;
	/** Payment amount */
	amount: string;
	/** Asset code (e.g., 'USDC', 'XLM') */
	assetCode: string;
	/** Asset issuer (required for non-native, auto-resolved for known assets) */
	assetIssuer?: string;
	/** Memo text for payment identification */
	memo?: string;
	/** Memo type (default: MEMO_TEXT) */
	memoType?: "MEMO_TEXT" | "MEMO_ID" | "MEMO_HASH" | "MEMO_RETURN";
	/** Human-readable message shown in wallet */
	msg?: string;
	/** Origin domain for trust verification */
	originDomain?: string;
}

/**
 * Build a SEP-7 `web+stellar:pay` URI for QR codes and deeplinks.
 *
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md
 *
 * @example
 * ```ts
 * const uri = buildPayUri({
 *   destination: 'G...',
 *   amount: '10.00',
 *   assetCode: 'USDC',
 *   memo: 'order-123',
 * });
 * // => "web+stellar:pay?destination=G...&amount=10.00&asset_code=USDC&..."
 * ```
 */
export function buildPayUri(params: Sep7PayParams): string {
	const { destination, amount, assetCode, memo, memoType, msg, originDomain } = params;

	const query = new URLSearchParams();
	query.set("destination", destination);
	query.set("amount", amount);

	const normalizedAsset = assetCode.toUpperCase();

	if (normalizedAsset === "XLM" || normalizedAsset === "NATIVE") {
		query.set("asset_code", "native");
	} else {
		query.set("asset_code", normalizedAsset);
		const issuer = params.assetIssuer ?? KNOWN_ISSUERS[normalizedAsset];
		if (!issuer) {
			throw new Error(
				`No issuer known for asset "${assetCode}". Provide assetIssuer explicitly.`,
			);
		}
		query.set("asset_issuer", issuer);
	}

	if (memo) {
		query.set("memo", memo);
		query.set("memo_type", memoType ?? "MEMO_TEXT");
	}

	if (msg) {
		query.set("msg", msg);
	}

	if (originDomain) {
		query.set("origin_domain", originDomain);
	}

	return `web+stellar:pay?${query.toString()}`;
}

/**
 * Parse a SEP-7 URI back into its component parameters.
 */
export function parseSep7Uri(uri: string): Sep7PayParams {
	if (!uri.startsWith("web+stellar:pay?")) {
		throw new Error("Invalid SEP-7 URI: must start with web+stellar:pay?");
	}

	const queryString = uri.slice("web+stellar:pay?".length);
	const params = new URLSearchParams(queryString);

	const destination = params.get("destination");
	if (!destination) {
		throw new Error("Invalid SEP-7 URI: missing destination");
	}

	const amount = params.get("amount");
	if (!amount) {
		throw new Error("Invalid SEP-7 URI: missing amount");
	}

	const assetCode = params.get("asset_code") ?? "native";

	return {
		destination,
		amount,
		assetCode: assetCode === "native" ? "XLM" : assetCode,
		assetIssuer: params.get("asset_issuer") ?? undefined,
		memo: params.get("memo") ?? undefined,
		memoType: (params.get("memo_type") as Sep7PayParams["memoType"]) ?? undefined,
		msg: params.get("msg") ?? undefined,
		originDomain: params.get("origin_domain") ?? undefined,
	};
}
