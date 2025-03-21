import { ModalSubmitInteraction, VoiceChannel } from "discord.js";
import { findOwnCustomVC } from "../modules/CategoryJTC";

export default {
  name: "interactionCreate",
  once: false,
  async execute(interaction: ModalSubmitInteraction): Promise<void> {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "limit_vc_modal") return;

    const userInput = interaction.fields.getTextInputValue("vc_limit");
    const limit = parseInt(userInput);

    if (isNaN(limit) || limit < 1 || limit > 99) {
      await interaction.reply({
        content: "**Please enter a valid number between 1 and 99.**",
        flags: "Ephemeral",
      });
      return;
    }

    const custom_vc = await findOwnCustomVC(interaction.user.id);
    if (!custom_vc) {
      await interaction.reply({
        content: "❌ You don't own a custom voice channel.",
        flags: "Ephemeral",
      });
      return;
    }

    const customVC = interaction.guild?.channels.cache.get(
      custom_vc.channel_id
    ) as VoiceChannel;

    if (!customVC) {
      await interaction.reply({
        content: "❌ Could not find your voice channel.",
        flags: "Ephemeral",
      });
      return;
    }

    try {
      await customVC.setUserLimit(limit);
      await interaction.reply({
        content: `✅ Voice channel limit set to **${limit}** users.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error setting VC limit:", error);
      await interaction.reply({
        content: "❌ Failed to set voice channel limit.",
        flags: "Ephemeral",
      });
    }
  },
};
