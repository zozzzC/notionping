import jest from "ts-jest";
import { IAddTaskProps, addTask } from "@/commands/notion/addTask";

describe("addTask tests", () => {
  it("creates a new task with just a name", async () => {
    const taskProps = {
      task: "task name",
    };
    const addedTask = await addTask(taskProps);
    expect(addedTask).toMatchObject({
      name: "New Task",
      value: "task name",
    });
  });
});
