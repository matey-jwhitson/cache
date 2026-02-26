import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const auth = JSON.parse(
  readFileSync(
    join(homedir(), "AppData", "Roaming", "com.vercel.cli", "Data", "auth.json"),
    "utf8"
  )
);
const token = auth.token;

const projectId = "prj_ST1PBWuzENsbVXK6Nbcq4AQlyuKM";
const teamId = "team_LuO4AfbnxRyJZIE5M51cpkOW";

const res = await fetch(
  `https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const data = await res.json();
console.log("Protection-related fields:");
console.log("  ssoProtection:", JSON.stringify(data.ssoProtection));
console.log("  passwordProtection:", JSON.stringify(data.passwordProtection));
console.log("  trustedIps:", JSON.stringify(data.trustedIps));
console.log("  protection:", JSON.stringify(data.protection));
console.log("  protectionBypass:", JSON.stringify(data.protectionBypass));

const keys = Object.keys(data).filter(
  (k) =>
    k.toLowerCase().includes("protect") ||
    k.toLowerCase().includes("auth") ||
    k.toLowerCase().includes("bypass") ||
    k.toLowerCase().includes("sso")
);
console.log("\nAll protection/auth keys:", keys);
for (const k of keys) {
  console.log(`  ${k}:`, JSON.stringify(data[k]));
}
