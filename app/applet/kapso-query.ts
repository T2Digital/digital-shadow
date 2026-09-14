import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  kapsoApiKey: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90",
  baseUrl: "https://api.kapso.ai/meta/whatsapp"
});

const run = async () => {
    try {
        console.log("Fetching conversations...");
        // Without phoneNumberId, does it work? Wait, in Kapso proxy extras:
        // client.conversations.query / list ?
        // let's try to query Kapso phone numbers
        const res = await fetch("https://api.kapso.ai/v1/whatsapp-phone-numbers", {
           headers: Object.assign({"X-API-Key": "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90"})
        });
        console.log("phones:", await res.text());
        
        // try another
        const res2 = await fetch("https://api.kapso.ai/v1/phone-numbers", {
           headers: Object.assign({"X-API-Key": "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90"})
        });
        console.log("phones 2:", await res2.text());
        
    } catch(e) {
        console.error("Error:", e);
    }
};
run();
