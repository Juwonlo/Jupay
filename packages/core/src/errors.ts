export class JupayError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = "JupayError";
	}
}

export class PaymentNotFoundError extends JupayError {
	constructor(paymentId: string) {
		super(`Payment request "${paymentId}" not found`, "PAYMENT_NOT_FOUND");
		this.name = "PaymentNotFoundError";
	}
}

export class PaymentExpiredError extends JupayError {
	constructor(paymentId: string) {
		super(`Payment request "${paymentId}" has expired`, "PAYMENT_EXPIRED");
		this.name = "PaymentExpiredError";
	}
}

export class InvalidConfigError extends JupayError {
	constructor(message: string) {
		super(message, "INVALID_CONFIG");
		this.name = "InvalidConfigError";
	}
}
