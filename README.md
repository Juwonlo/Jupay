# Jupay

Accept USDC and XLM payments on the Stellar network. Jupay is a TypeScript SDK that lets merchants create payment requests, generate wallet-compatible QR codes, and listen for on-chain confirmations in real time.

## Packages

| Package | Description |
|---------|-------------|
| [`jupay`](packages/jupay) | Umbrella package — re-exports everything from core and sep7 |
| [`@jupay/core`](packages/core) | Payment engine — request creation, Horizon streaming, matching |
| [`@jupay/sep7`](packages/sep7) | SEP-7 URI builder/parser and QR code generation |

## Quick Start

```bash
pnpm add jupay
```

```ts
import { JupayClient, generateQrDataUrl } from "jupay";

const jupay = new JupayClient({
  merchantAddress: "G...", // your Stellar address
  network: "mainnet",      // or "testnet"
  acceptedAssets: ["USDC", "XLM"],
});

// Create a payment request
const payment = await jupay.createPayment({
  amount: "10.00",
  currency: "USDC",
  reference: "order-123",
  expiresIn: 600, // seconds
});

// Generate a QR code for the customer
const qr = await generateQrDataUrl(payment.sep7Uri);

// Listen for confirmation
jupay.onConfirmed(payment.id, (receipt) => {
  console.log(`Paid! Tx: ${receipt.transactionHash}`);
});
```

## How It Works

1. **Create a payment** — generates a unique memo and SEP-7 URI
2. **Display QR code** — customer scans with any Stellar wallet (Lobstr, xBull, etc.)
3. **Stream payments** — Jupay opens an SSE connection to Horizon and watches for incoming payments
4. **Match & confirm** — payments are matched by memo (primary) or amount+asset within a 60s window (fallback)
5. **Callback fires** — your `onConfirmed` handler receives a `PaymentReceipt` with the transaction hash

## Configuration

```ts
interface JupayConfig {
  merchantAddress: string;              // Stellar public key (starts with G)
  network: "mainnet" | "testnet" | NetworkConfig;
  acceptedAssets?: string[];            // default: ["USDC", "XLM"]
  webhookUrl?: string;                  // payment notification endpoint
  webhookSecret?: string;              // HMAC secret for webhook signatures
}
```

## SEP-7 & QR Codes

Use `@jupay/sep7` directly for lower-level control:

```ts
import { buildPayUri, parseSep7Uri, generateQrSvg } from "@jupay/sep7";

const uri = buildPayUri({
  destination: "G...",
  amount: "25.00",
  assetCode: "USDC",
  memo: "order-456",
  msg: "Payment for coffee",
});

const svg = await generateQrSvg(uri, {
  size: 400,
  color: "#000000",
  errorCorrectionLevel: "H",
});
```

## Examples

See [`examples/express-checkout`](examples/express-checkout) for a working Express.js demo that creates a payment page with a QR code.

```bash
cd examples/express-checkout
pnpm install
pnpm dev
# Open http://localhost:3000/pay
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Project Structure

```
├── packages/
│   ├── core/          # Payment engine, Horizon streaming, matching
│   ├── sep7/          # SEP-7 URI builder/parser, QR generation
│   └── jupay/         # Umbrella package
├── examples/
│   └── express-checkout/  # Express.js demo
├── turbo.json         # Turborepo pipeline
├── biome.json         # Linter/formatter config
└── pnpm-workspace.yaml
```

## License

MIT
