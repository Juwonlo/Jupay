import { randomBytes } from "node:crypto";

/**
 * Generate a unique memo text for payment identification.
 * Uses 10 random bytes encoded as hex (20 chars), well within
 * Stellar's 28-byte memo text limit.
 */
export function generateMemo(): string {
	return randomBytes(10).toString("hex");
}

/**
 * Generate a unique payment request ID.
 * Format: jp_{16 hex chars}
 */
export function generatePaymentId(): string {
	return `jp_${randomBytes(8).toString("hex")}`;
}
