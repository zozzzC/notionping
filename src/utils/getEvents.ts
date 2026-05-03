import { notion } from "./getRelation";
import { config } from "@/config";
import { IEventsProps, INotionPage } from "@/types/Notion";

interface IEventsFormat {
  status: string;
  name: string;
  dueDate: string;
  assignedTo: string[];
}

export async function getEvent(event: string) {
  const associatedEvent = await notion.search({
    query: event,
    filter: {
      property: "object",
      value: "page",
    },
  });
  let eventId = null;
  if (associatedEvent.results.length === 0) {
    console.error("Cannot find an event with the corresponding name.");
    return undefined;
  } else {
    console.log(JSON.stringify(associatedEvent.results[0]));
    eventId = associatedEvent.results[0].id;
  }
  return eventId;
}
export async function getEvents(
  active: boolean = false,
): Promise<IEventsFormat[][]> {
  const paginatedEvents: IEventsFormat[][] = [];
  let nextPage = false;
  let nextCursor = undefined;
  let todaysDate = new Date();
  //NOTE: the time is in nzst, maybe this could go in config but i am a bit lazy
  const todaysDateString = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Pacific/Auckland",
  })
    .format(todaysDate)
    .split(" ")[0];
  do {
    const events = await notion.dataSources.query({
      data_source_id: process.env.NOTION_EVENTS_DB_ID!,
      filter: {
        and: [
          {
            property: "Status",
            status: {
              does_not_equal: "Done/Archived",
            },
          },
          {
            property: "Date",
            date: {
              on_or_after: todaysDateString,
            },
          },
        ],
      },
      sorts: [
        {
          property: "Date",
          direction: "ascending",
        },
      ],
      page_size: 5,
      start_cursor: nextCursor,
    });
    nextPage = events.has_more;
    if (nextPage) {
      nextCursor = events.next_cursor ?? undefined;
    }

    const res: IEventsFormat[] = [];
    for (const page of events.results) {
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
      if (typedPage.properties.Name.title[0]) {
        res.push({
          status: statusFormat ?? "",
          name: typedPage.properties.Name.title[0].plain_text,
          dueDate: typedPage.properties.Date?.date
            ? (typedPage.properties.Date?.date?.start as string)
            : "No date set.",
          assignedTo: typedPage.properties.Exec.people.map((p) => p.name),
        });
      }
    }
    paginatedEvents.push([...res]);
  } while (nextPage);
  return paginatedEvents;
}
