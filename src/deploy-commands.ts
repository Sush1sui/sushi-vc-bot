import { APIApplicationCommand, REST, Routes } from "discord.js";
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const commands: APIApplicationCommand[] = [];
const clientId = process.env.app_id;
const guildId = process.env.guild_id;
const bot_token = process.env.bot_token;

if (!clientId || !guildId || !bot_token)
  throw new Error("missing .env variables");

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
    const command = require(filePath);
    if ("data" in command.default && "execute" in command.default) {
      commands.push(command.default.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(bot_token);

// and deploy your commands!
export default async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data: APIApplicationCommand[] = (await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    )) as APIApplicationCommand[];

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
};
