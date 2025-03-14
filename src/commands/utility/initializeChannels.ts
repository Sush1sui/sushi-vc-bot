import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("initialize_channels")
    .setDescription("Automatically sets up bot, no custom tuning")
    .addStringOption((option) =>
      option
        .setName("category_id")
        .setDescription("The ID of the Category you want the bot to be setup")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    console.log("asdasda");
    try {
      const member = interaction.member;
      if (!member || !interaction.guild) {
        await interaction.reply({
          content: "This command can only be used in a guild.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply("Setting up channels... please wait.");

      const category_id = interaction.options.getString("category_id");

      // ✅ Check if bot has permissions to manage channels
      const botMember = await interaction.guild.members.fetchMe();

      if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.editReply(
          "I need the `Manage Channels` permission to create channels."
        );
        return;
      }

      const category = await interaction.guild.channels.fetch(category_id!);

      if (!category || category.type !== ChannelType.GuildCategory) {
        await interaction.editReply(
          "Category not found, please enter a correct category ID."
        );
        return;
      }

      const channel = await interaction.guild.channels.create({
        name: "Join to Create",
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id, // @everyone
            deny: [
              PermissionFlagsBits.Connect, // ❌ Prevent everyone from connecting
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ViewChannel,
            ],
          },
          {
            id: "1292473360114122784",
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.ViewChannel,
            ],
            deny: [
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AttachFiles,
            ],
          },
        ],
      });

      await interaction.editReply(
        `Voice channel **<#${channel.id}>** created under category **${category.name}**. Only <@&1292473360114122784> can connect.`
      );
      return;
    } catch (error) {
      console.error("Error creating voice channel:", error);
      await interaction.editReply("Failed to create voice channel.");
      return;
    }
  },
};
