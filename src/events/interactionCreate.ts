import { CommandInteraction, Events, Interaction } from "discord.js";
import { CustomClient } from "../app";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    // NOTE: Client instance is always available at "interaction.client"
    const customClient = interaction.client as CustomClient;
    const command = customClient.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.command} was found.`);
      return;
    }

    try {
      await command.execute(interaction as CommandInteraction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: "Ephemeral",
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: "Ephemeral",
        });
      }
    }
  },
};
