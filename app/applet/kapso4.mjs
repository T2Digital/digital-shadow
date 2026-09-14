import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  baseUrl: "https://api.kapso.ai/meta/whatsapp",
  kapsoApiKey: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90"
});

const run = async () => {
    try {
        console.log("Fetching conversations to find our phone number...");
        // Conversations list
        const res = await client.conversations.list({ limit: 1 });
        console.log("Conversations:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("Error:", e);
    }
};
run();
