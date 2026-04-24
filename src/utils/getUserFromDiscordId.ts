import { client } from "..";

export default async function getUserFromDiscordId(discordId: string) {
  const user = await client.users.fetch(discordId);
  return { execDiscordId: user.id, execDiscordUsername: user.username };
}
