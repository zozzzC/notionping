import {
  ApplicationCommand,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from "discord.js";
import { config } from "@/config";
import { deployCommands } from "./deployCommands";

const client = Object.assign(
  new Client({ intents: [GatewayIntentBits.Guilds] }),
  {
    commands: new Collection<string, ApplicationCommand>(),
  },
);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

console.log(config.GUILD_ID);
client.login(config.DISCORD_TOKEN);

(async () => await deployCommands())();
