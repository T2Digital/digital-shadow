import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  accessToken: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90",
  kapsoProxy: true // SDK might have an option for proxy? We'll see.
});

const run = async () => {
    try {
        console.log("Client methods:", Object.keys(client));
        // try fetching phone numbers via API
        const res = await client.fetch('https://api.kapso.ai/v1/phone-numbers', { method: 'GET' });
        const text = await res.text();
        console.log("Phone Numbers text:", text);
    } catch(e) {
        console.error("Error:", e);
    }
};
run();
