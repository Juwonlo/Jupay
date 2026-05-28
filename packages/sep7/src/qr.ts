import QRCode from "qrcode";

export interface QrOptions {
	/** Width/height in pixels (default: 300) */
	size?: number;
	/** Error correction level (default: 'M') */
	errorCorrectionLevel?: "L" | "M" | "Q" | "H";
	/** Dark module color (default: '#000000') */
	color?: string;
	/** Background color (default: '#ffffff') */
	backgroundColor?: string;
}

/**
 * Generate a QR code as a data URL (base64 PNG).
 * Can be used directly in an <img> tag's src attribute.
 *
 * @example
 * ```ts
 * const dataUrl = await generateQrDataUrl('web+stellar:pay?...');
 * // => "data:image/png;base64,..."
 * ```
 */
export async function generateQrDataUrl(
	content: string,
	options: QrOptions = {},
): Promise<string> {
	return QRCode.toDataURL(content, {
		width: options.size ?? 300,
		errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
		color: {
			dark: options.color ?? "#000000",
			light: options.backgroundColor ?? "#ffffff",
		},
		margin: 2,
	});
}

/**
 * Generate a QR code as an SVG string.
 * Useful for server-side rendering or when you need vector output.
 *
 * @example
 * ```ts
 * const svg = await generateQrSvg('web+stellar:pay?...');
 * // => "<svg xmlns=..."
 * ```
 */
export async function generateQrSvg(
	content: string,
	options: QrOptions = {},
): Promise<string> {
	return QRCode.toString(content, {
		type: "svg",
		width: options.size ?? 300,
		errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
		color: {
			dark: options.color ?? "#000000",
			light: options.backgroundColor ?? "#ffffff",
		},
		margin: 2,
	});
}
