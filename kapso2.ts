import { WhatsAppCloudApiClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppCloudApiClient({
  accessToken: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90",
  proxyBaseUrl: "https://api.kapso.ai", // if it supports that
});

const run = async () => {
    try {
        // Is there a phoneNumbers.list? Kapso-specific APIs?
        console.log(Object.keys(client));
    } catch(e) {
        console.error(e);
    }
};
run();
