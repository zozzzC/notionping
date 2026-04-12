import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import { notion } from "@/utils/getRelation";
import { config } from "@/config";
import { IMultiSelectItem, INotionPage, ITasksProps } from "@/types/Notion";
import getStatusGroup from "@/utils/getStatusGroup";
import { getRelation } from "@/utils/getRelation";
import { getExecDiscordFromNotion } from "@/utils/getExecDiscord";
import { readFile, writeFile } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName("addexecconfig")
    .setDescription(
      "Adds an exec's Notion username and Discord ID to the config.",
    )
    .addStringOption((option) =>
      option
        .setName("notiondisplayname")
        .setDescription("The exec's Notion display name.")
        .setRequired(true),
    )
    .setContexts(InteractionContextType.Guild),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    //NOTE: this command only works in a guild, not in dms.
    if (!interaction.guild) {
      return interaction.reply("This command can only be used in the server.");
    }

    const interactionUser = await interaction.guild!.members.fetch(
      interaction.user.id,
    );

    //NOTE: when adding bot to server make sure you restrict who can use the / command as you only want execs to add their emails into this.
    let confirmed = false;
    const notionId = interaction.options.get("notiondisplayname", true).value;
    console.log(`NotionID: ${JSON.stringify(notionId)}`);
    const confirm = new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Primary);
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
      confirm,
    ]);
    const message = await interaction.editReply({
      content: `Your Notion display name will be set to ${notionId}. Please click 'confirm' to continue.`,
      components: [buttons],
    });
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 10_000,
    });

    collector.on("collect", async (i) => {
      await i.reply("Please confirm your Notion display name.");
      if (i.user.id !== interaction.user.id) {
        return await i.reply({
          content: `You are not authorised to perform this action.`,
          ephemeral: true,
        });
      }

      if (i.customId === "confirm") {
        confirmed = true;
        //TODO: config.json dne
        readFile(__dirname + "/../../config.json", "utf8", (err, data) => {
          // console.log(__dirname + "../../conf");
          if (err) {
            console.error(`Error reading config file: ${err}`);
          }
          const parsedData = JSON.parse(data);
          parsedData[i.user.id] = notionId;
          writeFile(
            __dirname + "/../../config.json",
            JSON.stringify(parsedData),
            (err) => {
              if (err) {
                console.error(err);
              }
            },
          );
        });
        await message.edit({
          content: `Successfully linked ${i.user.username} with Notion user with the name ${notionId}`,
        });
      }
      collector.stop();
    });

    collector.on("end", async () => {
      if (!confirmed)
        await message.edit({
          content: "Notion linking unsuccessful.",
          embeds: [],
        });
    });
  },
};
