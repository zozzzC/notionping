import {
  ApplicationCommand,
  Client,
  Collection,
  CommandInteraction,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from "discord.js";
import { config } from "@/config";
import { deployCommands } from "./deployCommands";
import { getTodaysDueTasks } from "./utils/sendDueTask";

export const client = Object.assign(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessages,
    ],
  }),
  {
    commands: new Collection<string, ApplicationCommand>(),
  },
);

(async () => await deployCommands(client.commands))();

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.login(config.DISCORD_TOKEN);

//TODO: this needs to go in a cron job
(async () => {
  const todaysDueTasks = await getTodaysDueTasks();
  for (const task of todaysDueTasks) {
    const embed = new EmbedBuilder().setTitle("Due Today").addFields({
      name: `${task.taskStatus} ${task.taskName}`,
      value: `${task.taskEvent} | ${task.taskGroup} - ${task.taskType}`,
    });
    //TODO: make completed button
    // const completed = new ButtonBuilder().setCustomId().co

    client.users.send(task.exec, { embeds: [embed] });
  }
})();
