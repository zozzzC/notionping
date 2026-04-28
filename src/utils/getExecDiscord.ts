import { config } from "@/config";
import { notion } from "./getRelation";
export async function getExecNotionFromDiscord() {
  const newMap = new Map();

  for (const [key, value] of Object.entries(config.DISCORD_CONFIG)) {
    //@ts-ignore
    newMap.set(key, value.notionId);
  }

  console.log(newMap);

  return newMap;
}
export async function getExecDiscordFromNotion() {
  const execMap = new Map();
  for (const [key, value] of Object.entries(config.DISCORD_CONFIG)) {
    console.log(value);
    //@ts-ignore
    execMap.set(value.notionDisplayName, key);
  }

  console.log(execMap);

  return execMap;
}
