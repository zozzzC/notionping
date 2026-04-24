import { config } from "@/config";
import { notion } from "./getRelation";
export async function getExecNotionFromDiscord() {
  const execMap = new Map(Object.entries(config.DISCORD_CONFIG));
  const { results } = await notion.users.list({
    start_cursor: undefined,
    page_size: 50,
  });
  const resultsMap = new Map();
  for (const r of results) {
    resultsMap.set(r.name, r.id);
  }

  for (const key of execMap.keys()) {
    execMap.set(key, resultsMap.get(execMap.get(key)));
  }

  return execMap;
}
export async function getExecDiscordFromNotion() {
  const execMap = new Map();
  const discordConfig = config.DISCORD_CONFIG;
  for (const entry in discordConfig) {
    execMap.set(
      config.DISCORD_CONFIG[entry as keyof typeof discordConfig],
      entry,
    );
  }
  return execMap;
}
