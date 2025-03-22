import {
  ButtonInteraction,
  UserSelectMenuBuilder,
  ActionRowBuilder,
  UserSelectMenuInteraction,
  User,
  GuildMember,
  ChannelType,
  EmbedBuilder,
} from "discord.js";

export async function inviteVC(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  // Create a user select menu (searchable)
  const selectMenu = new UserSelectMenuBuilder()
    .setCustomId("vc_invite_menu")
    .setPlaceholder("Select users to invite")
    .setMinValues(1)
    .setMaxValues(5); // Max 5 users per invite

  const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    selectMenu
  );

  await interaction.reply({
    content: "**Select members to invite to the voice channel:**",
    components: [row],
    flags: "Ephemeral",
  });
}

export async function handleVCInviteSelection(
  interaction: UserSelectMenuInteraction
): Promise<void> {
  if (!interaction.guild || !interaction.member) return;

  await interaction.deferReply({ flags: "Ephemeral" });

  // Get selected users
  const selectedUserIds = interaction.values;
  const selectedUsers: User[] = selectedUserIds.map(
    (id) => interaction.client.users.cache.get(id)!
  );

  // Get the inviter's voice channel
  const inviter = interaction.member as GuildMember;
  const voiceChannel = inviter.voice.channel;

  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    await interaction.editReply({
      content: "❌ You must be in a voice channel to invite others.",
    });
    return;
  }

  // Create a VC invite link
  const invite = await voiceChannel.createInvite({ maxUses: 5, unique: true });

  // Send DM to selected users
  let successCount = 0;
  let usersMention = "";
  for (const user of selectedUsers) {
    try {
      const embed = new EmbedBuilder()
        .setDescription(
          `**<@${interaction.user.id}> has invited you to join a voice channel in ${interaction.guild.name}!**\n[Join Here](${invite.url})`
        )
        .setColor("White")
        .setFooter({
          text: "Do it with Finesse!",
          iconURL:
            "https://cdn.discordapp.com/emojis/1293411594621157458.webp?size=128&animated=true",
        });

      await user.send({
        embeds: [embed],
      });
      usersMention += ` <@${user.id}>`;
      successCount++;
    } catch (error) {
      console.error(`Failed to DM ${user.username}:`, error);
    }
  }

  await interaction.editReply({
    content: `✅ Successfully invited **${successCount}** users:${usersMention}.`,
  });
}
