import { Interaction } from "discord.js";
import { handleVCInviteSelection } from "../modules/interface_button_functions";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isUserSelectMenu()) return;
    if (interaction.customId !== "vc_invite_menu") return;

    await handleVCInviteSelection(interaction);
  },
};
