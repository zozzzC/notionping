import {
  ActionRowBuilder,
  ApplicationCommand,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Collection,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Interaction,
  MessageFlags,
  ReactionEmoji,
} from "discord.js";
import { config } from "@/config";
import { deployCommands } from "./deployCommands";
import { getTodaysDueTasks } from "./utils/sendDueTask";
import { getWeekTasks } from "./utils/getWeeksTasks";
import completeTask from "./utils/completeTask";
import { CronJob } from "cron";
import { getPresidentDiscord } from "./utils/getExecDiscord";

interface ClientWithCommand extends Client {
  commands: Collection<string, any>;
}

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

if (process.env.NODE_ENV !== "test") {
  console.log("Node env is not test, it is: " + process.env.NODE_ENV);

  (async () => await deployCommands(client.commands))();
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = (interaction.client as ClientWithCommand).commands.get(
      interaction.commandName,
    );

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
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

  const job = new CronJob(
    "0 9 * * 1",
    async function () {
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
    },
    null,
    true,
    "Pacific/Auckland",
  );

  job.start();

  const dailyJob = new CronJob(
    "* * * * *",
    async function () {
      const todaysDueTasks = await getTodaysDueTasks();
      console.log(todaysDueTasks);

      for (const task of todaysDueTasks) {
        const embed = new EmbedBuilder().setTitle("Due Today").addFields({
          name: `${task.taskStatus} ${task.taskName}`,
          value: `${task.taskEvent ?? "No event specified."} | ${task.taskGroup ?? "General"} - ${task.taskType ?? "No task type specified."}`,
        });

        console.log(`${task.taskStatus} ${task.taskName}`);

        const finishedButton = new ButtonBuilder()
          .setCustomId("finished")
          .setLabel("Finished")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(false);

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
          finishedButton,
        ]);

        const message = await client.users.send(task.exec, {
          embeds: [embed],
          components: [buttons],
        });

        //notify all users who said they want notifications for everything
        //TODO: make this less annoying...
        const notifyUsers = await getPresidentDiscord();
        for (const user of notifyUsers) {
          if (user.key !== task.exec) {
            const notifyUsersEmbed = new EmbedBuilder()
              .setTitle("Due Today")
              .addFields({
                name: `${task.taskStatus} ${task.taskName}`,
                value: `${task.taskEvent ?? "No event specified."} | ${task.taskGroup ?? "General"} - ${task.taskType ?? "No task type specified."}`,
              });

            await client.users.send(user.key, {
              embeds: [notifyUsersEmbed],
            });
          }
        }

        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 3_600_000,
        });

        collector.on("collect", async (i) => {
          if (i.customId === "finished") {
            console.log("clicked finished");
            await completeTask(task.taskId);
            const embed = new EmbedBuilder().setTitle("Due Today").addFields({
              name: `🟢 ${task.taskName}`,
              value: `${task.taskEvent ?? "No event specified."} | ${task.taskGroup ?? "General"} - ${task.taskType ?? "No task type specified."}`,
            });
            message.edit({ embeds: [embed], components: [] });
          }
        });
        collector.on("end", async () => {
          await message.edit({ components: [] });
        });
      }
    },
    null,
    true,
    "Pacific/Auckland",
  );

  dailyJob.start();
}
