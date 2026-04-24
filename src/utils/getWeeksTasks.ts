import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { notion } from "@/utils/getRelation";
import { config } from "@/config";
import { IMultiSelectItem, INotionPage, ITasksProps } from "@/types/Notion";
import getStatusGroup from "@/utils/getStatusGroup";
import { getRelation } from "@/utils/getRelation";
import { getExecDiscordFromNotion } from "@/utils/getExecDiscord";
//
// export default {
//   data: new SlashCommandBuilder()
//     .setName("getweekstasks")
//     .setDescription("Gets the tasks due within this week.")
//     .addStringOption((option) =>
//       option.setName("getweekstasks").setDescription("example"),
//     ),
//   async execute(interaction: CommandInteraction) {
//     await interaction.deferReply();
//     const formattedTasks = await getWeekTasks();
//     const embed = new EmbedBuilder().setTitle("This Week's Tasks").addFields(
//       formattedTasks.map((t) => {
//         return {
//           name: `${t.taskStatus} ${t.taskName}`,
//           value: `
//              ${t.taskDue} ${t.taskEvent ? `| ${t.taskEvent[0]}` : ``}
//              ${t.taskType ?? ""}${t.taskExec ? ` - ${t.taskExec} ` : ``}
//          `,
//         };
//       }),
//     );
//     await interaction.editReply({ content: "Test", embeds: [embed] });
//   },
// };
//

export async function getWeekTasks(): Promise<IWeekTasks[]> {
  const { results } = await notion.dataSources.query({
    data_source_id: config.NOTION_DB_ID,
    filter: {
      property: "Due",
      date: {
        this_week: {},
      },
    },
    sorts: [
      {
        property: "Due",
        direction: "ascending",
      },
    ],
  });
  //TODO: change this to an individual DM instead (look at sendDueTask for more info on how to do that)
  const statusMap = await getStatusGroup();
  const taskExecDiscord: IWeekTasks[] = [];
  const execMap = await getExecDiscordFromNotion();
  for (const task of results) {
    const typedTask = task as INotionPage<ITasksProps>;
    const {
      Name: name,
      Status: status,
      Due: due,
      Type: type,
      Exec: exec,
      Group: group,
      Event: event,
    } = typedTask.properties;

    if (name.title[0].text.content === null) {
      console.warn(`Skipping task because name is not provided.`);
      continue;
    }
    const taskName = name.title[0].plain_text;
    const taskEvent = await getRelation(event.relation);
    let taskStatus = statusMap.get(status.status.name);

    let taskDue = due ? due.date!.start : "No Due Date set.";
    if (
      Date.parse(due.date!.start as string) < Date.now() &&
      taskStatus !== "Complete"
    ) {
      taskDue = `❗${taskDue}`;
    }

    switch (taskStatus) {
      case "Complete":
        taskStatus = `🟢`;
        break;

      case "In progress":
        taskStatus = `🟡`;
        break;

      default:
        taskStatus = `🔴`;
        break;
    }

    let taskType: string | null = ``;
    console.log(type);
    if (type !== undefined) {
      for (const t of type.multi_select) {
        taskType = taskType + `${t.name} `;
      }
    }

    let taskGroup: string | null = null;
    if (group !== undefined) {
      for (const g of group.multi_select) {
        taskGroup = taskGroup + `${g.name} `;
      }
    }
    let taskExec: string | null = ``;
    if (exec !== undefined) {
      for (const e of exec.people) {
        if (execMap.get(e.name) !== undefined) {
          taskExecDiscord.push({
            exec: execMap.get(e.name) as string,
            taskName: taskName,
            taskEvent: taskEvent,
            taskStatus: taskStatus,
            taskDue: taskDue,
            taskType: taskType,
            taskGroup: taskGroup,
          });
        }
        // taskExecDiscord.push(execMap.get(e.name));
      }
    }
    //
    // res.push({
    //   taskName: taskName,
    //   taskEvent: taskEvent,
    //   taskStatus: taskStatus,
    //   taskDue: taskDue,
    //   taskType: taskType,
    //   taskExec: taskExec,
    //   taskGroup: taskGroup,
    //   taskExecDiscord: taskExecDiscord,
    // });
  }

  return taskExecDiscord;
}

interface IWeekTasks {
  exec: string;
  taskName: string;
  taskEvent: string[] | undefined;
  taskStatus: string;
  taskDue: string | null;
  taskType: string;
  taskGroup: string | null;
}
