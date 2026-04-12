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
import { getWeekTasks } from "./utils/getWeeksTasks";
import { exec } from "child_process";

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
  //run daily at 9
  for (const task of todaysDueTasks) {
    const embed = new EmbedBuilder().setTitle("Due Today").addFields({
      name: `${task.taskStatus} ${task.taskName}`,
      value: `${task.taskEvent ?? "No event specified."} | ${task.taskGroup ?? "General"} - ${task.taskType ?? "No task type specified."}`,
    });
    //TODO: make completed button
    // const completed = new ButtonBuilder().setCustomId().co

    client.users.send(task.exec, { embeds: [embed] });
  }

  //TODO: run every monday at 9
  const weekTasks = await getWeekTasks();
  const execTaskMap = new Map();
  for (const t of weekTasks) {
    if (execTaskMap.has(t.exec)) {
      const tasksArray = execTaskMap.get(t.exec);
      tasksArray.push({
        name: `${t.taskStatus} ${t.taskName}`,
        value: `${t.taskDue} ${t.taskEvent ? `| ${t.taskEvent[0]}` : ``}
                ${t.taskType ?? ""}`,
      });
      execTaskMap.set(t.exec, tasksArray);
    } else {
      const tasksArray = [
        {
          name: `${t.taskStatus} ${t.taskName}`,
          value: `${t.taskDue} ${t.taskEvent ? `| ${t.taskEvent[0]}` : ``}
                ${t.taskType ?? ""}`,
        },
      ];
      execTaskMap.set(t.exec, tasksArray);
    }
  }
  for (const key of execTaskMap.keys()) {
    const tasks = execTaskMap.get(key);
    const embed = new EmbedBuilder()
      .setTitle("This Week's Tasks")
      .addFields(tasks);
    client.users.send(key, { embeds: [embed] });
  }
})();
