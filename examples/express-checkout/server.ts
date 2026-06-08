import express from "express";
import { JupayClient, generateQrDataUrl } from "jupay";

// --- Configure Jupay ---
const jupay = new JupayClient({
	merchantAddress: "GBCXQUEPSEGIKXLYOIF6E4P5PZYXHIP4SIPTSLJNPBFLWG7IIUAO2GCJ", // Replace with your address
	network: "testnet",
	acceptedAssets: ["USDC", "XLM"],
});

jupay.on("payment:confirmed", (receipt) => {
	console.log(`Payment confirmed! Tx: ${receipt.transactionHash}`);
});

// --- Express app ---
const app = express();

app.get("/pay", async (_req, res) => {
	const payment = await jupay.createPayment({
		amount: "10.00",
		currency: "USDC",
		reference: `order-${Date.now()}`,
		expiresIn: 600,
	});

	jupay.onConfirmed(payment.id, (receipt) => {
		console.log(`Order ${payment.reference} paid! Tx: ${receipt.transactionHash}`);
	});

	const qrDataUrl = await generateQrDataUrl(payment.sep7Uri);

	res.send(`
    <html>
      <body style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h1>Pay 10.00 USDC</h1>
        <p>Scan with any Stellar wallet</p>
        <img src="${qrDataUrl}" width="300" height="300" />
        <p style="font-size: 12px; color: #666;">
          Payment ID: ${payment.id}<br/>
          Expires: ${new Date(payment.expiresAt).toLocaleTimeString()}
        </p>
        <p><a href="${payment.sep7Uri}">Open in wallet</a></p>
      </body>
    </html>
  `);
});

app.listen(3000, () => {
	console.log("Jupay checkout demo running at http://localhost:3000/pay");
});
