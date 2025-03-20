import { Client, Events } from "discord.js";
import deployCommands from "../deploy-commands";
import { initializeButtonCollector } from "../modules/interface_button_functions";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    if (!client.user) {
      console.log(client);
      console.log("client user not found");
      return;
    }

    deployCommands();
    initializeButtonCollector(client);

    console.log(`Logged in as ${client.user.tag}`);
  },
};
