import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  baseUrl: "https://api.kapso.ai/meta/whatsapp",
  kapsoApiKey: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90",
});

async function run() {
  // Let's try to query phone numbers or directly use "default"
  try {
     const numbers = await fetch("https://api.kapso.ai/meta/whatsapp/v19.0/me/phone_numbers", {
       headers: { 'Authorization': 'Bearer 98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90' }
     });
     console.log("numbers:", await numbers.text());
  } catch(e) {}
}

run();
