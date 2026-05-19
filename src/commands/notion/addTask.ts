import { getEvent } from "@/utils/getEvents";
import { getExecNotionFromDiscord } from "@/utils/getExecDiscord";
import { notion } from "@/utils/getRelation";
import { parseDate } from "chrono-node";
import { config } from "@/config";
import {
  ChatInputCommandInteraction,
  Embed,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
  User,
} from "discord.js";
import getUserFromDiscordId from "@/utils/getUserFromDiscordId";

export default {
  data: new SlashCommandBuilder()
    .setName("addtask")
    .setDescription("Adds a task.")
    .addStringOption((option) =>
      option
        .setName("taskname")
        .setDescription("The task name.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("discorduser")
        .setDescription("The user's Discord @.")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("due")
        .setDescription("The task due date.")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("event")
        .setDescription(
          "The task event name. The event must exist on Notion and the name is case sensitive.",
        )
        .setRequired(false),
    )
    .setContexts(InteractionContextType.Guild),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    let exec = interaction.options.getString("discorduser") ?? undefined;
    const taskProps: IAddTaskProps = {
      task: interaction.options.getString("taskname", true),
      execDiscord: exec ? exec.slice(2, -1) : undefined,
      due: interaction.options.getString("due") ?? undefined,
      event: interaction.options.getString("event") ?? undefined,
    };
    const res = await addTask(taskProps);
    if (res == undefined) {
      const embed = new EmbedBuilder().setTitle("Error").addFields({
        name: "Error",
        value: "Unknown error. Please try again.",
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    const embed = new EmbedBuilder().setTitle(res.name).addFields(res);
    if (exec) {
      await interaction.editReply({
        content: `<@${(await getUserFromDiscordId(exec.slice(2, -1))).execDiscordId}> you've got a new task!`,
        embeds: [embed],
      });
      return;
    }
    await interaction.editReply({ embeds: [embed] });
  },
};

export interface IAddTaskProps {
  task: string;
  execDiscord?: string;
  due?: string;
  event?: string;
  discordMessage?: string;
}

export async function addTask(
  taskProps: IAddTaskProps,
): Promise<{ name: string; value: string } | undefined> {
  const execNotion = await getExecNotionFromDiscord();
  const { task, execDiscord, due, event, discordMessage } = taskProps;
  let execDiscordId = undefined;
  let execDiscordUsername = undefined;
  if (execDiscord) {
    const { execDiscordId: eDi, execDiscordUsername: eDu } =
      await getUserFromDiscordId(execDiscord);
    execDiscordId = eDi;
    execDiscordUsername = eDu;
  }

  try {
    if (execDiscordId && !execNotion.get(execDiscordId)) {
      return {
        name: "Error",
        value: `Cannot find a Notion user associated with the given Discord @. Please do /addExecConfig to link their Discord and Notion.`,
      };
    }
    let associatedUser, eventId, date;
    if (due) {
      date = parseDate(due);
      if (!date) {
        return {
          name: `Error`,
          value: `Could not parse provided date ${due}. Please try again.`,
        };
      }
    }

    if (execDiscordId) {
      associatedUser = execNotion.get(execDiscordId) ?? null;
    }
    if (event) {
      eventId = await getEvent(event);
      if (eventId == undefined) {
        return {
          name: `Error`,
          value: `The provided event ${event} does not exist in the related Events database. Please create the event in Notion and try again.`,
        };
      }
    }
    const createProps = {
      Name: {
        title: [
          {
            text: {
              content: task,
            },
          },
        ],
      },
      ...(date && {
        Due: {
          date: {
            start: date.toISOString().split("T")[0],
            end: null,
            time_zone: null,
          },
        },
      }),
      ...(associatedUser
        ? {
            Exec: {
              people: [
                {
                  id: associatedUser,
                },
              ],
            },
          }
        : {}),
    };

    const notionPage = await notion.pages.create({
      parent: {
        data_source_id: config.NOTION_DB_ID!,
      },
      properties: createProps,
    });
    //NOTE: you can't directly add a related page on the create command, so we need to update if we want the event to be related.
    if (eventId) {
      await notion.pages.update({
        page_id: notionPage.id, // page you want to update
        properties: {
          Event: {
            relation: [
              {
                id: eventId, // related page id
              },
            ],
          },
        },
      });
    }
    console.log("create successful!");
    let res = {
      name: ``,
      value: `\n ${event ? `${event} ` : ``}${associatedUser ? `${execDiscordUsername} ` : ``}${date ? `!${date.toISOString().split("T")[0]}` : ``}`,
    };
    return res;
  } catch (err) {
    console.error(err);
  }
}
