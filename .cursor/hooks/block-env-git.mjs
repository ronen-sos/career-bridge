#!/usr/bin/env node
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const command = input.command ?? "";

const stagesEnvFile =
  /\bgit\s+add\b/.test(command) &&
  /\.env\b/.test(command) &&
  !/\.env\.example\b/.test(command);

const pushesEnvFile =
  /\bgit\s+push\b/.test(command) &&
  /\.env\b/.test(command) &&
  !/\.env\.example\b/.test(command);

if (stagesEnvFile || pushesEnvFile) {
  console.log(
    JSON.stringify({
      permission: "deny",
      user_message:
        "Blocked: .env files must not be committed or pushed. Set production secrets in the Railway dashboard only.",
      agent_message:
        "Refuse git commands that stage or push .env files. Use .env.example for placeholders.",
    }),
  );
  process.exit(2);
}

console.log(JSON.stringify({ permission: "allow" }));
process.exit(0);
