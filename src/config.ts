import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const raw = readFileSync(path.join(__dirname, "./config.json"), "utf8");
const configFile = JSON.parse(raw);

if (process.env.NODE_ENV == "production") {
  dotenv.config({ path: ".env.production" });
} else {
  console.log("Using development/test environment.");
  dotenv.config({ path: ".env.development" });
}

const {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  GUILD_ID,
  NOTION_DB_ID,
  NOTION_TOKEN,
  EXEC_ROLE_ID,
} = process.env;
if (
  !DISCORD_TOKEN ||
  !DISCORD_CLIENT_ID ||
  !GUILD_ID ||
  !NOTION_DB_ID ||
  !NOTION_TOKEN ||
  !EXEC_ROLE_ID
) {
  throw new Error("Missing env variables. See .env.example for all envs.");
}

export const config = {
  DISCORD_TOKEN: DISCORD_TOKEN!,
  DISCORD_CLIENT_ID: DISCORD_CLIENT_ID!,
  GUILD_ID: GUILD_ID!,
  NOTION_DB_ID: NOTION_DB_ID!,
  NOTION_TOKEN: NOTION_TOKEN!,
  EXEC_ROLE_ID: EXEC_ROLE_ID!,
  DISCORD_CONFIG: configFile,
};
