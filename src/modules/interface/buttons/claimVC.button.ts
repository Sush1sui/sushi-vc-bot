import { ButtonInteraction, VoiceChannel } from "discord.js";
import { findCustomVC, changeOwnerCustomVC } from "../../CategoryJTC";

export async function claimVC(interaction: ButtonInteraction) {
  const member = interaction.member;
  if (!member || !interaction.guild) return;

  await interaction.deferReply({ flags: "Ephemeral" });

  const user = interaction.guild?.members.cache.get(member.user.id);
  const custom_vc = await findCustomVC(user?.voice.channelId!);
  if (!custom_vc) return;

  const customVC = (await interaction.guild.channels.fetch(
    custom_vc.channel_id
  )) as VoiceChannel;

  const owner = interaction.guild.members.cache.get(custom_vc.owner_id);
  const ownerInVC = owner?.voice?.channelId !== null; // Checks if they are in any VC

  if (ownerInVC) {
    await interaction.editReply({
      content: "**The owner is still in the voice channel.**",
    });
    return;
  }

  await customVC.permissionOverwrites.edit(custom_vc.owner_id, {
    ManageChannels: false,
    MoveMembers: false,
  });

  await customVC.permissionOverwrites.edit(interaction.user.id, {
    Connect: true,
    Speak: true,
    ManageChannels: true,
    MoveMembers: true,
    ReadMessageHistory: true,
  });

  await changeOwnerCustomVC(custom_vc.channel_id, interaction.user.id);

  await interaction.editReply({
    content: "**Claiming VC successful! You are the new owner of the VC now.**",
  });
  return;
}
