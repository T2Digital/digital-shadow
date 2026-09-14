import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  baseUrl: "https://api.kapso.ai/meta/whatsapp",
  kapsoApiKey: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90"
});

const run = async () => {
    try {
        console.log("Sending msg to the active session...");
        const res = await client.messages.sendText({
            phoneNumberId: "597907523413541",
            to: "201030956097",
            body: "الظل بيمسي (ملاحظة: هذا الرقم الوحيد الذي لديه جلسة نشطة في Sandbox)"
        });
        console.log("Success:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("Error:", e.message);
    }
};
run();
