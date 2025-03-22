import { Interaction } from "discord.js";
import { handleSelectedPermittedUsers } from "../modules/interface/buttons/permitVC.button";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isUserSelectMenu()) return;
    if (interaction.customId !== "permit_menu") return;

    await handleSelectedPermittedUsers(interaction);
  },
};
