const apiKey = "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90";
const phone = "201224118713";
const text = "الظل بيمسي";

async function send() {
  const endpoints = [
    "https://api.kapso.ai/whatsapp/send",
    "https://api.kapso.ai/v1/whatsapp/send",
    "https://api.kapso.ai/send",
    "https://app.kapso.ai/api/v1/messages",
    "https://app.kapso.ai/api/messages"
  ];

  for (const url of endpoints) {
    console.log("Trying", url);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to: phone,
          message: text
        })
      });
      console.log(resp.status);
      if (resp.ok) return;
    } catch (e) {
    }
  }
}
send();
