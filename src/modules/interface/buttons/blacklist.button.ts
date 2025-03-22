import {
  ButtonInteraction,
  UserSelectMenuBuilder,
  ActionRowBuilder,
  UserSelectMenuInteraction,
  User,
  VoiceChannel,
} from "discord.js";
import { findOwnCustomVC } from "../../CategoryJTC";

export async function blacklist(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  // Create a user select menu (searchable)
  const selectMenu = new UserSelectMenuBuilder()
    .setCustomId("blacklist_menu")
    .setPlaceholder("Select users to blacklist")
    .setMinValues(1)
    .setMaxValues(5);

  const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    selectMenu
  );

  await interaction.reply({
    content: "**Select members to blacklist to this channel**",
    components: [row],
    flags: "Ephemeral",
  });
}

export async function handleBlacklistSelection(
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
        Connect: false,
        SendMessages: false,
        ReadMessageHistory: false,
      });
    }

    await interaction.editReply({ content: "**Blacklisting successful**" });
  } catch (error) {
    await interaction.editReply({
      content: `**Failed to blacklist.**`,
    });
  }
}
