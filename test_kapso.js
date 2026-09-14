require('dotenv').config();
const apiKey = "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90";
const phone = "201224118713";
const text = "الظل بيمسي";

async function send() {
  const endpoints = [
    "https://api.kapso.ai/v1/messages",
    "https://api.kapso.ai/messages",
    "https://api.kapso.ai/v1/whatsapp/messages"
  ];

  for (const url of endpoints) {
    console.log("Trying", url);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Api-Key': apiKey // in case it uses this
        },
        body: JSON.stringify({
          to: phone,
          phone: phone,
          target: phone,
          recipient: phone,
          type: "text",
          text: { body: text },
          message: text,
          body: text
        })
      });
      const data = await resp.text();
      console.log(resp.status, data);
      if (resp.ok) return;
    } catch (e) {
      console.error("Error", e.message);
    }
  }
}
send();
