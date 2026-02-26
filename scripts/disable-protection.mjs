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
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ssoProtection: null,
      passwordProtection: null,
      trustedIps: null,
    }),
  }
);

const data = await res.json();
if (!res.ok) {
  console.error("Error:", res.status, JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("Deployment protection updated:");
console.log("  ssoProtection:", JSON.stringify(data.ssoProtection));
console.log("  passwordProtection:", JSON.stringify(data.passwordProtection));
console.log("  trustedIps:", JSON.stringify(data.trustedIps));
