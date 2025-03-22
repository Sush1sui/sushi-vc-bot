import { Interaction } from "discord.js";
import { handleBlacklistSelection } from "../modules/interface/buttons/blacklist.button";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isUserSelectMenu()) return;
    if (interaction.customId !== "blacklist_menu") return;

    await handleBlacklistSelection(interaction);
  },
};
