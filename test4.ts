import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  baseUrl: "https://api.kapso.ai/meta/whatsapp",
  kapsoApiKey: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90",
});

async function run() {
  try {
     const res = await client.messages.sendText({
       phoneNumberId: "123", // Let's see if Kapso ignores it or throws error
       to: "201224118713",
       body: "الظل بيمسي"
     });
     console.log(res);
  } catch(e) {
     console.log(e.response?.data || e.message);
  }
}

run();
