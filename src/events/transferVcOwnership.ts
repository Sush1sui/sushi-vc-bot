import { Interaction } from "discord.js";
import { handleTransferOwnership } from "../modules/interface/buttons/transferOwnership.button";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isUserSelectMenu()) return;
    if (interaction.customId !== "transfer_ownership_menu") return;

    await handleTransferOwnership(interaction);
  },
};
