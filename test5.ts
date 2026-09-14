import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  baseUrl: "https://api.kapso.ai/meta/whatsapp",
  kapsoApiKey: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90",
});

async function run() {
  try {
     const res2 = await fetch("https://api.kapso.ai/v1/projects", {
       headers: { 'Authorization': 'Bearer 98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90' }
     });
     console.log("projects", await res2.text());
     
     // let's try to query kapso proxy without phone numbers
     const req = await fetch("https://api.kapso.ai/meta/whatsapp/v19.0/me/phone_numbers", {
       headers: { 'Authorization': 'Bearer 98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90' }
     });
     console.log("me/phone_numbers", await req.text());
  } catch(e) {
     console.log(e.message);
  }
}

run();
