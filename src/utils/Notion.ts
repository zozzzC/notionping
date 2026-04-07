import { Client } from "@notionhq/client";
import { config } from "@/config";
import { ITitle } from "@/types/Notion";
export const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function getRelation(
  notionDbId: string,
  relationPropName: string,
  relationIds: { id: string }[],
) {
  //we can determine the linked db's ID by figuring out the data source properties.

  const { properties } = await notion.dataSources.retrieve({
    data_source_id: notionDbId,
  });

  // console.log(JSON.stringify(properties));
  if (relationPropName in properties) {
    //@ts-ignore
    const relatedDbId = properties[relationPropName].relation.database_id;
  }
  const relationNames: string[] = [];
  for (const r of relationIds) {
    const relatedPage = await notion.pages.retrieve({
      page_id: r.id,
    });
    // console.log(JSON.stringify(relatedPage));
    //@ts-ignore
    const relatedPageName = relatedPage.properties["Name"] as ITitle;
    relationNames.push(relatedPageName.title[0].plain_text);
  }
  return relationNames;
}
