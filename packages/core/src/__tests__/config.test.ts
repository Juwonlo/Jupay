import { describe, expect, it } from "vitest";
import { resolveNetwork } from "../config.js";

describe("resolveNetwork", () => {
	it("resolves testnet", () => {
		const config = resolveNetwork("testnet");
		expect(config.horizonUrl).toBe("https://horizon-testnet.stellar.org");
		expect(config.networkPassphrase).toContain("Test SDF Network");
	});

	it("resolves mainnet", () => {
		const config = resolveNetwork("mainnet");
		expect(config.horizonUrl).toBe("https://horizon.stellar.org");
		expect(config.networkPassphrase).toContain("Public Global Stellar Network");
	});

	it("throws for unknown network name", () => {
		expect(() => resolveNetwork("devnet")).toThrow('Unknown network "devnet"');
	});

	it("passes through custom NetworkConfig", () => {
		const custom = {
			horizonUrl: "https://custom.horizon.example.com",
			networkPassphrase: "Custom Network",
		};
		expect(resolveNetwork(custom)).toBe(custom);
	});
});
