import {
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { config } from "@/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
// Construct and prepare an instance of the REST module
console.log(`Setting up REST with discord token ${config.DISCORD_TOKEN}`);

// and deploy your commands!
export const deployCommands = async () => {
  const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
  // Grab all the command folders from the commands directory you created earlier
  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".ts"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const { default: command } = await import(filePath);
      if ("data" in command && "execute" in command) {
        console.log(`Pushing the command at ${filePath}...`);
        commands.push(command.data.toJSON());
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
    }
  }

  const rest = new REST().setToken(config.DISCORD_TOKEN);
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(
        config.DISCORD_CLIENT_ID,
        config.GUILD_ID!,
      ),
      { body: commands },
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
};
