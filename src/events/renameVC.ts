import { Interaction } from "discord.js";
import { handleRenameVC } from "../modules/interface/buttons/renameVC.button";

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
