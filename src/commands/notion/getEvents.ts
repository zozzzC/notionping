import { getEvents } from "@/utils/getEvents";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
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
    const paginatedEvents = await getEvents(false);
    const pages: EmbedBuilder[] = [];
    for (const events of paginatedEvents) {
      const embed = new EmbedBuilder()
        .addFields(
          events.map((e) => {
            return { name: e.name, value: e.dueDate };
          }),
        )
        .setDescription("Upcoming Events by Date.");
      pages.push(embed);
    }
    let index = 0;
    let nextPageExists = true;

    if (paginatedEvents.length > 1) {
      nextPageExists = false;
    }

    const first = new ButtonBuilder()
      .setCustomId("first")
      .setLabel("first")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    const prev = new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    const next = new ButtonBuilder()
      .setCustomId("next")
      .setLabel("next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(nextPageExists);
    const last = new ButtonBuilder()
      .setCustomId("last")
      .setLabel("last")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(nextPageExists);
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
      first,
      prev,
      next,
      last,
    ]);

    const message = await interaction.editReply({
      embeds: [pages[index]],
      components: [buttons],
    });
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 10_000,
    });

    collector.on("collect", async (i) => {
      await i.reply({ content: "Processing...", ephemeral: true });
      await i.deleteReply();
      if (i.user.id !== interaction.user.id)
        return await i.reply({
          content: `You are not authorised to perform this action.`,
          ephemeral: true,
        });

      if (i.customId === "first") {
        index = 0;
      } else if (i.customId === "prev") {
        if (index > 0) index--;
      } else if (i.customId === "next") {
        if (index < pages.length) index++;
      } else if (i.customId === "last") {
        index = pages.length - 1;
      }

      if (index === 0) {
        first.setDisabled(true);
        prev.setDisabled(true);
      } else {
        first.setDisabled(false);
        prev.setDisabled(false);
      }

      if (index === pages.length - 1) {
        last.setDisabled(true);
        next.setDisabled(true);
      } else {
        next.setDisabled(false);
        last.setDisabled(false);
      }

      await message
        .edit({ embeds: [pages[index]], components: [buttons] })
        .catch((err) => {});
      collector.resetTimer();
    });

    collector.on("end", async () => {
      await message.edit({ embeds: [pages[index]], components: [] });
    });

    return message;
  },
};
