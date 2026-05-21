import { config } from "@/config";
import { notion } from "./getRelation";
import getNotionUser from "./getNotionUser";
export async function getExecNotionFromDiscord() {
  console.log(config.DISCORD_CONFIG);
  const newMap = new Map();
  for (const [key, value] of Object.entries(config.DISCORD_CONFIG)) {
    //@ts-ignore
    newMap.set(key, value.notionId);
  }

  return newMap;
}
export async function getExecDiscordFromNotion() {
  console.log(config.DISCORD_CONFIG);
  const execMap = new Map();
  for (const [key, value] of Object.entries(config.DISCORD_CONFIG)) {
    console.log(value);
    //@ts-ignore
    const notionDisplayName = await getNotionUser(value.notionId);
    execMap.set(notionDisplayName, key);
  }

  console.log(execMap);

  return execMap;
}

export async function getPresidentDiscord() {
  const res = [];
  for (const [key, value] of Object.entries(config.DISCORD_CONFIG)) {
    //@ts-ignore
    if (value.admin !== undefined) {
      //@ts-ignore
      if (value.admin === true) {
        console.log("get pres");
        console.log(key);
        console.log(value);
        //@ts-ignore
        res.push({ key: key, value: value.notionId });
      }
    }
  }
  return res;
}
