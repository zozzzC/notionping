import getUserFromDiscordId from "@/utils/getUserFromDiscordId";
import {
  ChatInputCommandInteraction,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import { readFile, writeFile } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName("addnotify")
    .setDescription("Toggle ping for all due tasks.")
    .setContexts(InteractionContextType.Guild),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    if (!interaction.guild) {
      return interaction.reply("This command can only be used in the server.");
    }

    const discordId = interaction.user.id;
    const user = await getUserFromDiscordId(discordId);

    readFile(__dirname + "/../../config.json", "utf8", (err, data) => {
      if (err) {
        console.error(`Error reading config file: ${err}`);
      }

      //try to find the user inside of our config file
      const parsedData = JSON.parse(data);
      if (!(discordId in parsedData)) {
        interaction.reply(
          `Cannot find a user with the Discord ${user.execDiscordUsername}. Please run /addexecconfig first and try again.`,
        );
        return;
      }

      parsedData[discordId] = {
        ...parsedData[discordId],
        admin: parsedData[discordId].admin
          ? !parsedData[discordId].admin
          : true,
      };

      writeFile(
        __dirname + "/../../config.json",
        JSON.stringify(parsedData),
        (err) => {
          if (err) {
            console.error(err);
          }
        },
      );
      interaction.followUp(
        `Set ${user.execDiscordUsername}'s all notifications to ${parsedData[discordId].admin}.`,
      );
    });
  },
};
