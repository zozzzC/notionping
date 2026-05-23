import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { getRelation, notion } from "@/utils/getRelation";
import { config } from "@/config";
import {
  DataSourceObjectResponse,
  PageObjectResponse,
  PartialDataSourceObjectResponse,
  PartialPageObjectResponse,
  QueryDataSourceParameters,
  QueryDataSourceResponse,
} from "@notionhq/client";
import {
  IDateItem,
  IPeopleItem,
  IRelationItem,
  IStatusItem,
  ITitle,
} from "@/types/Notion";
//TODO: get tasks by event function

export default {
  data: new SlashCommandBuilder()
    .setName("getduetasks")
    .setDescription("Gets the first 10 tasks by due date order.")
    .addStringOption((option) =>
      option.setName("getduetasks").setDescription("example"),
    ),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    const tasks = await getDueTasks();
    const formattedTasks = await formatTasks(tasks);
    const embed = new EmbedBuilder().setTitle("Today's Due Tasks").addFields(
      formattedTasks.map((t) => {
        return {
          name: `${t.status} ${t.name}
          `,
          value: `${t.dueDate} | ${t.event ?? "General"}`,
        };
      }),
    );
    await interaction.editReply({ embeds: [embed] });
  },
};

interface IGetTasks {
  dueWithin: "week" | "today" | "month" | "all";
  dueRange: number;
  event?: string;
  seeDone?: boolean;
  offset: number;
}

async function getTasks(props: IGetTasks) {
  const { dueWithin, dueRange, event, seeDone, offset } = props;

  let filter: QueryDataSourceParameters["filter"] =
    {} as QueryDataSourceParameters["filter"];

  let dateFilter;

  switch (dueWithin) {
    case "week":
      dateFilter = {
        this_week: {},
      };
      break;
    case "today":
      dateFilter = {
        equals: "today",
      };
      break;
    case "month":
      dateFilter = {
        this_month: {},
      };
    default:
      dateFilter = {
        on_or_after: "2020-01-01",
      };
      break;
  }

  if (seeDone !== true) {
    filter = {
      ...filter,
      or: [
        {
          and: [
            {
              property: "Status",
              status: { does_not_equal: "Done" },
            },
            {
              property: "Date",
              date: {
                on_or_before: "today",
              },
            },
          ],
        },
        {
          and: [
            {
              property: "Status",
              status: { does_not_equal: "Done" },
            },
            {
              property: "Date",
              date: {
                ...dateFilter,
              },
            },
          ],
        },
      ],
    };
  } else {
    filter = {
      ...filter,
      property: "Date",
      date: {
        ...dateFilter,
      },
    };
  }

  if (event !== undefined) {
  }

  const tasks = await notion.dataSources.query({
    data_source_id: config.NOTION_DB_ID,
    //@ts-ignore
    filter: { ...filter },
  });
  return tasks.results as PageObjectResponse[];
}

interface ITasksFormat {
  status: string;
  name: string;
  dueDate: string;
  assignedTo: string[];
  event: string;
}

async function formatTasks(
  tasks: Array<PageObjectResponse>,
  showDate: boolean = false,
) {
  const formattedTasks: ITasksFormat[] = [];
  for (const e of tasks) {
    const nameProperty = e.properties["Name"] as ITitle;
    const dateProperty = e.properties["Date"] as IDateItem;
    const statusProperty = e.properties["Status"] as IStatusItem;
    const relationProperty = e.properties["Event"] as IRelationItem;
    console.log(JSON.stringify(e.properties));

    let statusFormat = statusProperty.status.name;
    switch (statusFormat) {
      case "Not started":
        statusFormat = `🔴`;
        break;
      case "In progress":
        statusFormat = `🟡`;
        break;
      default:
        statusFormat = `🟢`;
        break;
    }
    const assignedProperty = e.properties["Exec"] as IPeopleItem;
    const relation = await getRelation(relationProperty.relation);
    const formattedTask = {
      status: statusFormat ?? "",
      name: nameProperty.title[0].plain_text ?? "",
      dueDate: showDate ? (dateProperty.date?.start ?? "No due date set.") : "",
      assignedTo: assignedProperty.people.map((p) => p.name),
      event: relation ? relation[0] : "No Event Specified",
    };
    formattedTasks.push(formattedTask);
  }
  return formattedTasks;
}

async function getDueTasks(
  limit: number = 7,
  offset: number = 0,
): Promise<PageObjectResponse[]> {
  const tasks = await notion.dataSources.query({
    data_source_id: config.NOTION_DB_ID,
    filter: {
      property: "Status",
      status: { does_not_equal: "Done" },
    },
  });
  return tasks.results as PageObjectResponse[];
}
