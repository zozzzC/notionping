import { notion } from "./Notion";
import { config } from "@/config";
import { IEventsProps, INotionPage } from "@/types/Notion";

interface IEventsFormat {
  status: string;
  name: string;
  dueDate: string;
  assignedTo: string[];
}
export async function getEvents(
  active: boolean = false,
): Promise<IEventsFormat[][]> {
  const paginatedEvents: IEventsFormat[][] = [];
  let nextPage = false;
  let nextCursor = undefined;
  do {
    const events = await notion.dataSources.query({
      data_source_id: process.env.NOTION_EVENTS_DB_ID!,
      filter: {
        property: "Status",
        status: {
          does_not_equal: "Done/Archived",
        },
      },
      page_size: 5,
      start_cursor: nextCursor,
    });
    nextPage = events.has_more;
    if (nextPage) {
      nextCursor = events.next_cursor ?? undefined;
    }

    const res: IEventsFormat[] = [];
    for (const page of events.results) {
      console.log(page);
      const typedPage = page as INotionPage<IEventsProps>;
      let status = typedPage.properties.Status.status;
      let statusFormat = "";
      if (status == null) {
        statusFormat = "";
      } else {
        switch (status.name) {
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
      }
      res.push({
        status: statusFormat ?? "",
        name: typedPage.properties.Name.title[0].plain_text,
        dueDate: typedPage.properties.Date?.date
          ? (typedPage.properties.Date?.date?.start as string)
          : "No date set.",
        assignedTo: typedPage.properties.Exec.people.map((p) => p.name),
      });
    }
    paginatedEvents.push([...res]);
  } while (nextPage);
  return paginatedEvents;
}
