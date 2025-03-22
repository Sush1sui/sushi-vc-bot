import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  VoiceChannel,
} from "discord.js";
import { findOwnCustomVC } from "../../CategoryJTC";
import {
  renameCount,
  MAX_RENAMES,
  renameCooldown,
  COOLDOWN_PERIOD,
} from "../interface_button_functions";

export async function promptRenameVC(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.member) return;

  const modal = new ModalBuilder()
    .setCustomId("rename_vc_modal")
    .setTitle("Rename Voice Channel");

  const nameInput = new TextInputBuilder()
    .setCustomId("vc_new_name")
    .setLabel("Enter the new VC name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(32); // Set max length for a channel name

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);

  modal.addComponents(row);

  await interaction.showModal(modal);
}

export async function handleRenameVC(interaction: ModalSubmitInteraction) {
  const member = interaction.member;
  if (!member || !interaction.guild) return;

  await interaction.deferReply({ flags: "Ephemeral" });

  const custom_vc = await findOwnCustomVC(member.user.id);
  if (!custom_vc || member.user.id !== custom_vc.owner_id) return;

  const customVC = interaction.guild.channels.cache.get(
    custom_vc.channel_id
  ) as VoiceChannel;

  if (!customVC) {
    console.error("Failed to fetch custom VC.");
    return;
  }

  try {
    // 👉 Track rename count
    const currentRenames = renameCount.get(customVC.id) || 0;
    if (currentRenames >= MAX_RENAMES) {
      console.log(
        `**Rename limit reached for ${customVC.name}. Please try again in more or less 10 minutes.**`
      );

      // Only update permissions without renaming

      await interaction.editReply({
        content: `**Rename limit reached for ${customVC.name}. Please try again in more or less 10 minutes.**`,
      });
      return;
    }

    // ✅ Increment rename count
    renameCount.set(customVC.id, currentRenames + 1);

    // ✅ If this is the first rename, start cooldown timer
    if (currentRenames + 1 === MAX_RENAMES) {
      console.log(`Cooldown started for ${customVC.name}`);
      renameCooldown.set(
        customVC.id,
        setTimeout(() => {
          renameCount.set(customVC.id, 0); // Reset count after cooldown
          renameCooldown.delete(customVC.id);
          console.log(`Cooldown expired for ${customVC.name}`);
        }, COOLDOWN_PERIOD)
      );
    }
    await customVC.edit({
      name: interaction.fields.getTextInputValue("vc_new_name"),
    });
    await interaction.editReply({
      content: `**Renaming VC successful.**`,
    });
    return;
  } catch (error) {
    console.error(`Error renaming VC: ${(error as Error).message}`);
    await interaction.editReply({
      content: "**Failed to rename VC.**",
    });
  }
}
