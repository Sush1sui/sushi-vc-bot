import { Interaction } from "discord.js";
import { handleRenameVC } from "../modules/interface_button_functions";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction: Interaction): Promise<void> {
    if (
      interaction.isModalSubmit() &&
      interaction.customId === "rename_vc_modal"
    ) {
      await handleRenameVC(interaction);
    }
  },
};
