import {
  ActivityType,
  Client,
  Collection,
  GatewayIntentBits,
} from "discord.js";
import "dotenv/config";
import loadCommands from "./loadCommands";
import loadEvents from "./loadEvents";

export interface CustomClient extends Client {
  commands: Collection<string, any>;
}

export const finest_roleID = "1292473360114122784";

export function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildVoiceStates,
    ],
  }) as CustomClient;

  client.commands = new Collection();

  loadCommands(client);
  loadEvents(client);

  client.once("ready", () => {
    client.user?.setPresence({
      status: "online",
      activities: [
        {
          name: "VC with Finesse!",
          type: ActivityType.Custom,
        },
      ],
    });
  });

  client
    .login(process.env.bot_token)
    .then(() => {
      console.log(`Logged in as ${client.user?.tag}`);
    })
    .catch((error) => {
      console.error("Failed to log in:", error);
    });
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
