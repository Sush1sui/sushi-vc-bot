import {
  ButtonInteraction,
  UserSelectMenuBuilder,
  ActionRowBuilder,
  UserSelectMenuInteraction,
  VoiceChannel,
} from "discord.js";
import {
  findOwnCustomVC,
  findCustomVC,
  changeOwnerCustomVC,
} from "../../CategoryJTC";

export async function transferOwnership(
  interaction: ButtonInteraction
): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  const customVC = await findOwnCustomVC(interaction.member.user.id);
  if (!customVC) {
    await interaction.reply({
      content: "**You do not own a custom VC**",
      flags: "Ephemeral",
    });
    return;
  }

  // Create a user select menu (searchable)
  const selectMenu = new UserSelectMenuBuilder()
    .setCustomId("transfer_ownership_menu")
    .setPlaceholder("Select a user to transfer the VC Ownership")
    .setMinValues(1)
    .setMaxValues(1);

  const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    selectMenu
  );

  await interaction.reply({
    content: "**Select a user to transfer the VC Ownership**",
    components: [row],
    flags: "Ephemeral",
  });
}

export async function handleTransferOwnership(
  interaction: UserSelectMenuInteraction
) {
  if (!interaction.guild || !interaction.member) return;

  await interaction.deferReply({ flags: "Ephemeral" });

  const selectedUserId = interaction.values[0]; // Get the selected user ID
  const member = interaction.guild.members.cache.get(interaction.user.id);
  const selectedMember = interaction.guild.members.cache.get(selectedUserId);

  if (!member || !selectedMember) {
    await interaction.editReply({
      content: "**User not found. Please try again.**",
    });
    return;
  }

  // Find the custom VC owned by the interaction user
  const custom_vc = await findCustomVC(member.voice.channelId!);
  if (!custom_vc) {
    await interaction.editReply({
      content: "**You are not in a custom VC.**",
    });
    return;
  }

  // Ensure the user is the current owner of the VC
  if (custom_vc.owner_id !== member.user.id) {
    await interaction.editReply({
      content: "**You are not the owner of this VC.**",
    });
    return;
  }

  const customVC = (await interaction.guild.channels.fetch(
    custom_vc.channel_id
  )) as VoiceChannel;

  // Check if the selected user is in the same VC
  if (!customVC.members.has(selectedUserId)) {
    await interaction.editReply({
      content:
        "**The selected user must be in the same voice channel to transfer ownership.**",
    });
    return;
  }

  // Update permissions
  await customVC.permissionOverwrites.edit(custom_vc.owner_id, {
    ManageChannels: false,
    MoveMembers: false,
  });

  await customVC.permissionOverwrites.edit(selectedUserId, {
    Connect: true,
    Speak: true,
    ManageChannels: true,
    MoveMembers: true,
    ReadMessageHistory: true,
  });

  // Update database to reflect new ownership
  await changeOwnerCustomVC(custom_vc.channel_id, selectedUserId);

  await interaction.editReply({
    content: `**Ownership has been transferred to <@${selectedUserId}>.**`,
  });
}
