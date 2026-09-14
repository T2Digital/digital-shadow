const { execSync } = require('child_process');
try {
  const out = execSync('npx -y @kapso/cli whatsapp numbers list', {
    env: { ...process.env, KAPSO_API_KEY: "98e50c910e60946ad1d51867a1e8a478b75a0adc486b8c196b73d380fdb66a90" }
  });
  console.log(out.toString());
} catch(e) {
  console.log(e.stdout?.toString());
  console.log(e.stderr?.toString());
}
