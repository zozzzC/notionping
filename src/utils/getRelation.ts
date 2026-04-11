import { Client } from "@notionhq/client";
import { config } from "@/config";
import { ITitle } from "@/types/Notion";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function getRelation(relationIds: { id: string }[]) {
  const relationNames: string[] = [];
  for (const r of relationIds) {
    const relatedPage = await notion.pages.retrieve({
      page_id: r.id,
    });
    //@ts-ignore
    const relatedPageName = relatedPage.properties["Name"] as ITitle;
    relationNames.push(relatedPageName.title[0].plain_text);
  }
  if (relationNames.length == 0) {
    return undefined;
  }
  return relationNames;
}
