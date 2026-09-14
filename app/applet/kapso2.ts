import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  accessToken: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90"
});

const run = async () => {
    try {
        console.log("Client:", Object.keys(client));
        // let's try to send a message without a phone number ID if it allows it.
        // kapso API might be sending using the project default phone number ID
        // wait, we can just fetch /v1/phone-numbers from kapso API using the raw fetcher
        const res = await client.fetch('https://api.kapso.ai/v1/phone-numbers', { method: 'GET' });
        const json = await res.json();
        console.log("Phone Numbers:", json);
    } catch(e) {
        console.error("Error:", Object.keys(e), e.message, e);
    }
};
run();
