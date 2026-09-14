import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  kapsoApiKey: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90",
  baseUrl: "https://api.kapso.ai/meta/whatsapp"
});

const run = async () => {
    try {
        console.log("Sending msg with dummy ID...");
        const res = await client.messages.sendText({
            phoneNumberId: "default", 
            to: "201224118713",
            body: "الظل بيمسي"
        });
        console.log("Success:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("Error:", e.message);
    }
    
    try {
        console.log("Sending msg with 0...");
        const res = await client.messages.sendText({
            phoneNumberId: "0", 
            to: "201224118713",
            body: "الظل بيمسي"
        });
        console.log("Success:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("Error:", e.message);
    }
};
run();
