export type PaymentStatus = "pending" | "confirmed" | "expired" | "failed";

export interface PaymentRequestParams {
	/** Amount to charge (e.g., '10.00') */
	amount: string;
	/** Asset code: 'USDC' or 'XLM' */
	currency: string;
	/** Merchant-defined reference (e.g., order ID) */
	reference?: string;
	/** Seconds until payment expires (default: 300) */
	expiresIn?: number;
}

export interface PaymentRequest {
	/** Unique payment request ID */
	id: string;
	/** Stellar memo used to identify this payment */
	memo: string;
	/** SEP-7 URI for wallet deeplinks */
	sep7Uri: string;
	/** Amount requested */
	amount: string;
	/** Asset code */
	currency: string;
	/** Merchant reference */
	reference?: string;
	/** Merchant Stellar address */
	destination: string;
	/** Current status */
	status: PaymentStatus;
	/** ISO timestamp when the request was created */
	createdAt: string;
	/** ISO timestamp when the request expires */
	expiresAt: string;
}

export interface PaymentReceipt {
	/** Payment request ID */
	paymentId: string;
	/** Stellar transaction hash */
	transactionHash: string;
	/** Sender's Stellar address */
	from: string;
	/** Amount received */
	amount: string;
	/** Asset code received */
	asset: string;
	/** Stellar ledger number */
	ledger: number;
	/** ISO timestamp of confirmation */
	confirmedAt: string;
}

export type PaymentConfirmedCallback = (receipt: PaymentReceipt) => void;
export type PaymentExpiredCallback = (paymentId: string) => void;
