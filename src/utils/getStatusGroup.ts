import { INotionPage, IStatusItem } from "@/types/Notion";
import { notion } from "./Notion";
import { config } from "@/config";
export default async function getStatusGroup() {
  const notionRes = await notion.dataSources.retrieve({
    data_source_id: config.NOTION_DB_ID,
  });
  const { Status: status } = notionRes.properties;
  if (status.type !== "status") {
    throw new Error(
      `Could not find status property for your tasks database. Unable to parse status.`,
    );
  }

  const optionsMap = new Map();
  const resMap = new Map();

  for (const option of status.status.options) {
    optionsMap.set(option.id, option.name);
  }

  for (const group of status.status.groups) {
    for (const optionId of group.option_ids) {
      resMap.set(optionsMap.get(optionId), group.name);
    }
  }

  return resMap;
}
