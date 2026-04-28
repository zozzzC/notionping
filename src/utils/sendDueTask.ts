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
import { client } from "@/index";

export async function getTodaysDueTasks() {
  //TODO: the date is not being properly parsed, i think this is because notion defaults to utc time.
  let todaysDate = new Date();
  //NOTE: the time is in nzst, maybe this could go in config but i am a bit lazy
  const todaysDateString = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Pacific/Auckland",
  })
    .format(todaysDate)
    .split(" ")[0];
  const { results } = await notion.dataSources.query({
    data_source_id: config.NOTION_DB_ID,
    filter: {
      and: [
        {
          property: "Due",
          date: {
            on_or_before: todaysDateString,
          },
        },
        {
          property: "Status",
          status: {
            does_not_equal: "Done",
          },
        },
      ],
    },
  });

  console.log(JSON.stringify(results));

  //NOTE: notion does not allow us to query by status group, but because filtering by everything that is on or before today is expensive with large amounts of data, we assume 'Done' is the only status within the Completed group.

  const statusMap = await getStatusGroup();
  const execMap = await getExecDiscordFromNotion();
  let taskExecDiscord = [];
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
    if (type !== undefined) {
      for (const t of type.multi_select) {
        taskType = taskType + `${t.name} `;
      }
    }

    let taskGroup: string | null = "";
    if (group !== undefined) {
      for (const g of group.multi_select) {
        taskGroup = taskGroup + `${g.name} `;
      }
    } else {
      taskGroup = null;
    }

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
            taskId: typedTask.id,
          });
        } else {
          console.error(
            `Could not find user ${e.name}'s Discord ID. Please ensure that their Discord ID is added into config.json.`,
          );
        }
      }
    }
  }

  return taskExecDiscord;
}
