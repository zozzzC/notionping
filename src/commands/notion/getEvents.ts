import { getEvents } from "@/utils/getEvents";
import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("getupcomingevents")
    .setDescription("Gets the first 10 upcoming events.")
    .addStringOption((option) =>
      option.setName("getduetasks").setDescription("example"),
    ),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    await getEvents(false);
    const embed = new EmbedBuilder().setTitle("Upcoming Events").addFields();
    await interaction.editReply({ embeds: [embed] });
  },
};
