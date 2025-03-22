import {
  ButtonInteraction,
  UserSelectMenuBuilder,
  ActionRowBuilder,
  UserSelectMenuInteraction,
  User,
  VoiceChannel,
} from "discord.js";
import { findOwnCustomVC } from "../../CategoryJTC";

export async function permitVC(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  // Create a user select menu (searchable)
  const selectMenu = new UserSelectMenuBuilder()
    .setCustomId("permit_menu")
    .setPlaceholder("Select users to permit")
    .setMinValues(1)
    .setMaxValues(5);

  const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    selectMenu
  );

  await interaction.reply({
    content: "**Select members to permit to this channel**",
    components: [row],
    flags: "Ephemeral",
  });
}

export async function handleSelectedPermittedUsers(
  interaction: UserSelectMenuInteraction
): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  await interaction.deferReply({ flags: "Ephemeral" });

  // Get selected users
  const selectedUserIds = interaction.values;
  const selectedUsers: User[] = selectedUserIds.map(
    (id) => interaction.client.users.cache.get(id)!
  );

  const custom_vc = await findOwnCustomVC(interaction.member.user.id);
  if (!custom_vc || interaction.member.user.id !== custom_vc.owner_id) return;

  const customVC = interaction.guild.channels.cache.get(
    custom_vc.channel_id
  ) as VoiceChannel;

  if (!customVC) return;

  try {
    for (const user of selectedUsers) {
      await customVC.permissionOverwrites.edit(user.id, {
        Connect: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });
    }

    await interaction.editReply({ content: "**Permit successful**" });
  } catch (error) {
    await interaction.editReply({
      content: `**Permit to blacklist.**`,
    });
  }
}
