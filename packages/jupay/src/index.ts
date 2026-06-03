// Re-export everything from @jupay/core
export {
	JupayClient,
	type ClientEvents,
	type JupayConfig,
	type NetworkConfig,
	type PaymentRequest,
	type PaymentRequestParams,
	type PaymentReceipt,
	type PaymentStatus,
	type PaymentConfirmedCallback,
	type PaymentExpiredCallback,
	type HorizonPaymentRecord,
	NETWORKS,
	USDC_ISSUER,
	JupayError,
	PaymentNotFoundError,
	PaymentExpiredError,
	InvalidConfigError,
	buildSep7Uri,
} from "@jupay/core";

// Re-export QR and SEP-7 utilities from @jupay/sep7
export {
	buildPayUri,
	parseSep7Uri,
	type Sep7PayParams,
	generateQrDataUrl,
	generateQrSvg,
	type QrOptions,
} from "@jupay/sep7";
