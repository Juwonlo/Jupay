import type { Horizon } from "@stellar/stellar-sdk";

/**
 * Resolve the memo from a transaction given a payment operation record.
 * Horizon payment stream records don't include memo directly,
 * so we fetch the parent transaction.
 */
export async function resolveMemo(
	server: Horizon.Server,
	transactionHash: string,
): Promise<{ memo?: string; memoType?: string }> {
	try {
		const tx = await server.transactions().transaction(transactionHash).call();
		return {
			memo: tx.memo,
			memoType: tx.memo_type,
		};
	} catch {
		return {};
	}
}
