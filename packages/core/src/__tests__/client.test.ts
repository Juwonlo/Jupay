import { describe, expect, it } from "vitest";
import { JupayClient } from "../client.js";
import { InvalidConfigError, PaymentNotFoundError } from "../errors.js";

const VALID_ADDRESS = "GBCXQUEPSEGIKXLYOIF6E4P5PZYXHIP4SIPTSLJNPBFLWG7IIUAO2GCJ";

describe("JupayClient", () => {
	it("creates with valid config", () => {
		const client = new JupayClient({
			merchantAddress: VALID_ADDRESS,
			network: "testnet",
		});
		expect(client).toBeInstanceOf(JupayClient);
		client.destroy();
	});

	it("throws on missing merchantAddress", () => {
		expect(() => new JupayClient({ merchantAddress: "", network: "testnet" })).toThrow(
			InvalidConfigError,
		);
	});

	it("throws on invalid merchantAddress format", () => {
		expect(() => new JupayClient({ merchantAddress: "invalid", network: "testnet" })).toThrow(
			InvalidConfigError,
		);
	});

	it("throws on missing network", () => {
		expect(
			() => new JupayClient({ merchantAddress: VALID_ADDRESS, network: "" }),
		).toThrow();
	});

	it("creates a payment request", async () => {
		const client = new JupayClient({
			merchantAddress: VALID_ADDRESS,
			network: "testnet",
		});

		const payment = await client.createPayment({
			amount: "10.00",
			currency: "USDC",
			reference: "order-123",
			expiresIn: 300,
		});

		expect(payment.id).toMatch(/^jp_/);
		expect(payment.amount).toBe("10.00");
		expect(payment.currency).toBe("USDC");
		expect(payment.reference).toBe("order-123");
		expect(payment.status).toBe("pending");
		expect(payment.sep7Uri).toContain("web+stellar:pay?");
		expect(payment.destination).toBe(VALID_ADDRESS);

		client.destroy();
	});

	it("rejects unaccepted asset", async () => {
		const client = new JupayClient({
			merchantAddress: VALID_ADDRESS,
			network: "testnet",
			acceptedAssets: ["USDC"],
		});

		await expect(
			client.createPayment({ amount: "10.00", currency: "XLM" }),
		).rejects.toThrow(InvalidConfigError);

		client.destroy();
	});

	it("retrieves a payment by ID", async () => {
		const client = new JupayClient({
			merchantAddress: VALID_ADDRESS,
			network: "testnet",
		});

		const payment = await client.createPayment({ amount: "5.00", currency: "USDC" });
		const retrieved = client.getPayment(payment.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(payment.id);

		client.destroy();
	});

	it("cancels a payment", async () => {
		const client = new JupayClient({
			merchantAddress: VALID_ADDRESS,
			network: "testnet",
		});

		const payment = await client.createPayment({ amount: "5.00", currency: "USDC" });
		client.cancelPayment(payment.id);

		const cancelled = client.getPayment(payment.id);
		expect(cancelled?.status).toBe("failed");

		client.destroy();
	});

	it("throws when cancelling unknown payment", () => {
		const client = new JupayClient({
			merchantAddress: VALID_ADDRESS,
			network: "testnet",
		});

		expect(() => client.cancelPayment("jp_nonexistent")).toThrow(PaymentNotFoundError);
		client.destroy();
	});

	it("throws when registering callback for unknown payment", async () => {
		const client = new JupayClient({
			merchantAddress: VALID_ADDRESS,
			network: "testnet",
		});

		expect(() => client.onConfirmed("jp_nonexistent", () => {})).toThrow(PaymentNotFoundError);
		client.destroy();
	});
});
