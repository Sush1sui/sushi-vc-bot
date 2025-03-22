import { Interaction } from "discord.js";
import { handleVCInviteSelection } from "../modules/interface/buttons/invite.button";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isUserSelectMenu()) return;
    if (interaction.customId !== "vc_invite_menu") return;

    await handleVCInviteSelection(interaction);
  },
};
