import { client } from "@/index";

export default async function getUserFromDiscordId(discordId: string) {
  console.log(discordId);
  const user = await client.users.fetch(discordId);
  return { execDiscordId: user.id, execDiscordUsername: user.username };
}
