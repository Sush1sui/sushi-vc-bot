import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

export async function limitVC(interaction: ButtonInteraction) {
  const member = interaction.member;
  if (!member || !interaction.guild) return;

  const modal = new ModalBuilder()
    .setCustomId("limit_vc_modal")
    .setTitle("Set Voice Channel Limit");

  const limitInput = new TextInputBuilder()
    .setCustomId("vc_limit")
    .setLabel("Enter a user limit (1-99)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("e.g., 10");

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    limitInput
  );

  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}
