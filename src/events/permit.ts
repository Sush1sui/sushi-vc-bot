import { Interaction } from "discord.js";
import { handleSelectedPermittedUsers } from "../modules/interface_button_functions";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isUserSelectMenu()) return;
    if (interaction.customId !== "permit_menu") return;

    await handleSelectedPermittedUsers(interaction);
  },
};
