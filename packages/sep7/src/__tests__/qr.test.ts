import { describe, expect, it } from "vitest";
import { generateQrDataUrl, generateQrSvg } from "../qr.js";

describe("generateQrDataUrl", () => {
	it("returns a base64 PNG data URL", async () => {
		const dataUrl = await generateQrDataUrl("web+stellar:pay?destination=G...");
		expect(dataUrl).toMatch(/^data:image\/png;base64,/);
	});

	it("accepts custom size", async () => {
		const dataUrl = await generateQrDataUrl("test", { size: 500 });
		expect(dataUrl).toMatch(/^data:image\/png;base64,/);
	});
});

describe("generateQrSvg", () => {
	it("returns an SVG string", async () => {
		const svg = await generateQrSvg("web+stellar:pay?destination=G...");
		expect(svg).toContain("<svg");
		expect(svg).toContain("</svg>");
	});

	it("accepts custom colors", async () => {
		const svg = await generateQrSvg("test", {
			color: "#ff0000",
			backgroundColor: "#00ff00",
		});
		expect(svg).toContain("<svg");
	});
});
