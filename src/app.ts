import { ActivityType } from "../node_modules/discord-api-types/v10";
import { Client } from "../node_modules/discord.js/typings/index";
import { Collection } from "../node_modules/discord.js/typings/index";
import { GatewayIntentBits } from "../node_modules/discord-api-types/v10";

import "dotenv/config";
import loadCommands from "./loadCommands";
import loadEvents from "./loadEvents";

export interface CustomClient extends Client {
  commands: Collection<string, any>;
}

export function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMessageReactions,
    ],
  }) as CustomClient;

  client.commands = new Collection();

  loadCommands(client);
  loadEvents(client);

  client.login(process.env.bot_token);
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
