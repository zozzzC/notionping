import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("getduetasks")
    .setDescription("Gets the first 10 tasks by due date order.")
    .addStringOption((option) =>
      option.setName("getduetasks").setDescription("example"),
    ),
  async execute(interaction: CommandInteraction) {
    await interaction.reply("hello!");
  },
};
