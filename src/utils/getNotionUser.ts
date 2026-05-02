import { notion } from "./getRelation";
export default async function getNotionUser(notionId: string) {
  try {
    const user = await notion.users.retrieve({
      user_id: notionId,
    });
    return user.name as string;
  } catch {
    console.error(`Could not find a Notion user with the id ${notionId}`);
    throw new Error("Could not find a Notion user with the given id.");
  }
}
