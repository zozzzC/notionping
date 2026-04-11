import { config } from "@/config";
export async function getExecDiscordFromEmail() {
  const execMap = new Map(Object.entries(config.DISCORD_CONFIG));
  return execMap;
}
export async function getExecEmailFromDiscord() {
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
