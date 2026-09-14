const sendKapsoMessage = async () => {
  const token = '98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90';
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);
  myHeaders.append("Content-Type", "application/json");

  // some usual kapso message payload structures
  // either { to: "+201224118713", type: "text", text: { body: "الظل بيمسي" }}
  // or { phone: "+201224118713", message: "الظل بيمسي" }
  // Let's try standard WhatsApp Cloud API payload style kapso uses
  const urlsToTry = [
    "https://api.kapso.ai/v1/messages",
    "https://api.kapso.ai/v1/whatsapp/send",
    "https://hook.kapso.ai/api/v1/messages",
  ];

  const payload1 = JSON.stringify({
    to: "+201224118713",
    type: "text",
    text: { body: "الظل بيمسي" }
  });

  const payload2 = JSON.stringify({
    phone: "201224118713",
    message: "الظل بيمسي"
  });
  
  for (const url of urlsToTry) {
     for(const payload of [payload1, payload2]) {
         try {
             console.log(`Trying ${url} with ${payload}`);
             const res = await fetch(url, { method: "POST", headers: myHeaders, body: payload });
             const text = await res.text();
             console.log(`Response HTTP ${res.status}: ${text}`);
         } catch(e) {
             console.log(`Error on ${url}:`, e.message);
         }
     }
  }
};

sendKapsoMessage();
