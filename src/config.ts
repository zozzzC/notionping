import dotenv from "dotenv";
import { watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let configFile = "";

watch(path.join(__dirname, "./config.json"), async (eventType, filePath) => {
  if (eventType === "change") {
    try {
      const raw = await readFile(path.join(__dirname, "./config.json"), "utf8");
      if (!raw.trim()) return; // skip empty writes
      configFile = JSON.parse(raw);
      console.log("Config reloaded:", configFile);
    } catch (err) {
      console.error("Failed to reload config (likely mid-write):", err);
    }
  }
});

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
  //this getter function enables us to fetch the current value of configFile. this is because if we didn't do this, it would just keep the old (empty string) value and return that every time we import config.
  get DISCORD_CONFIG() {
    return configFile;
  },
};
