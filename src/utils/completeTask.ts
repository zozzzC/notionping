import { notion } from "./getRelation";

export default async function completeTask(taskId: string) {
  const res = await notion.pages.update({
    page_id: taskId,
    properties: {
      Status: {
        status: {
          name: "Done",
        },
      },
    },
  });
  console.log(res);
}
