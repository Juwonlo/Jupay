import { Horizon, Networks } from "@stellar/stellar-sdk";

export interface NetworkConfig {
	horizonUrl: string;
	networkPassphrase: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
	mainnet: {
		horizonUrl: "https://horizon.stellar.org",
		networkPassphrase: Networks.PUBLIC,
	},
	testnet: {
		horizonUrl: "https://horizon-testnet.stellar.org",
		networkPassphrase: Networks.TESTNET,
	},
};

export const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

export interface JupayConfig {
	/** Stellar address that receives payments */
	merchantAddress: string;
	/** Network to use: 'testnet' | 'mainnet' | custom NetworkConfig */
	network: string | NetworkConfig;
	/** Assets the merchant accepts (default: ['USDC', 'XLM']) */
	acceptedAssets?: string[];
	/** Webhook URL for payment notifications */
	webhookUrl?: string;
	/** HMAC secret for webhook signature verification */
	webhookSecret?: string;
}

export function resolveNetwork(network: string | NetworkConfig): NetworkConfig {
	if (typeof network === "string") {
		const config = NETWORKS[network];
		if (!config) {
			throw new Error(`Unknown network "${network}". Use "mainnet", "testnet", or pass a custom NetworkConfig.`);
		}
		return config;
	}
	return network;
}

export function createHorizonServer(config: NetworkConfig): Horizon.Server {
	return new Horizon.Server(config.horizonUrl);
}
