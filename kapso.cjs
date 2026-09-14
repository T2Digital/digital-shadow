const sendKapsoMessage = async () => {
  const token = '98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90';
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);
  myHeaders.append("Content-Type", "application/json");

  // It's possible the user has webhook set up as app.kapso.ai not api.kapso.ai. Let's try it.
  const urlsToTry = [
    "https://api.kapso.ai/v1/messages",
    "https://api.kapso.ai/v1/projects/default/messages",
    "https://api.kapso.ai/messages",
    "https://app.kapso.ai/api/v1/messages",
    "https://app.kapso.ai/api/messages"
  ];

  const payload1 = JSON.stringify({
    to: "+201224118713",
    type: "text",
    text: { body: "الظل بيمسي" }
  });

  const payload2 = JSON.stringify({
    phone: "+201224118713",
    message: "الظل بيمسي"
  });
  
  for (const url of urlsToTry) {
     for(const payload of [payload1, payload2]) {
         try {
             const res = await fetch(url, { method: "POST", headers: myHeaders, body: payload });
             const text = await res.text();
             console.log(`URL ${url} payload: ${payload.includes('phone') ? '2' : '1'} -> HTTP ${res.status}: ${text.slice(0, 50)}`);
         } catch(e) {
             console.log(e.message);
         }
     }
  }
};

sendKapsoMessage();
