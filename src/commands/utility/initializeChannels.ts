import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { initializeCategoryJTC } from "../../modules/CategoryJTC";
import {
  interface_buttons_row1,
  interface_buttons_row2,
  interface_buttons_row3,
  interface_embed,
} from "../../modules/interface_template";
import {
  blacklist,
  claimVC,
  hide_unhide_VC,
  inviteVC,
  limitVC,
  lockVC,
  permitVC,
  promptRenameVC,
  transferOwnership,
  unlockVC,
} from "../../modules/interface_button_functions";

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
    try {
      const member = interaction.member;
      if (!member || !interaction.guild) {
        await interaction.reply({
          content: "This command can only be used in a guild.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();
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

      const jtc_channel = await interaction.guild.channels.create({
        name: "Join to Create",
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id, // @everyone
            deny: [
              PermissionFlagsBits.Connect, // ❌ Prevent everyone from connecting
              PermissionFlagsBits.SendMessages,
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
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
      });

      const interface_channel = await interaction.guild.channels.create({
        name: "vc-interface",
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ViewChannel,
            ],
          },
          {
            id: "1292473360114122784",
            allow: [PermissionFlagsBits.ViewChannel],
            deny: [
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.CreateEvents,
              PermissionFlagsBits.CreatePublicThreads,
              PermissionFlagsBits.CreatePrivateThreads,
              PermissionFlagsBits.AddReactions,
            ],
          },
        ],
      });

      const interface_message = await interface_channel.send({
        embeds: [interface_embed],
        components: [
          interface_buttons_row1,
          interface_buttons_row2,
          interface_buttons_row3,
        ],
      });

      const collector = interface_message.createMessageComponentCollector();

      collector.on("collect", async (interaction_button) => {
        if (!interaction_button.isButton()) return;

        console.log(`Interaction received: ${interaction_button.customId}`);

        if (interaction_button.customId === "lock_vc") {
          await lockVC(interaction_button);
        } else if (interaction_button.customId === "unlock_vc") {
          await unlockVC(interaction_button);
        } else if (interaction_button.customId === "hide") {
          await hide_unhide_VC(interaction_button, "hide");
        } else if (interaction_button.customId === "unhide") {
          await hide_unhide_VC(interaction_button);
        } else if (interaction_button.customId === "limit") {
          await limitVC(interaction_button);
        } else if (interaction_button.customId === "invite") {
          await inviteVC(interaction_button);
        } else if (interaction_button.customId === "blacklist") {
          await blacklist(interaction_button);
        } else if (interaction_button.customId === "permit") {
          await permitVC(interaction_button);
        } else if (interaction_button.customId === "rename") {
          await promptRenameVC(interaction_button);
        } else if (interaction_button.customId === "claim_vc") {
          await claimVC(interaction_button);
        } else if (interaction_button.customId === "transfer_owner") {
          await transferOwnership(interaction_button);
        }
      });

      const initializedCategortyJTC = await initializeCategoryJTC(
        interface_channel.id,
        interface_message.id,
        jtc_channel.id,
        category.id
      );

      if (!initializedCategortyJTC) {
        interface_channel.delete();
        jtc_channel.delete();
        await interaction.editReply(
          "There is already an initialized VC interface in this category"
        );
        return;
      }

      await interaction.editReply(
        `Interace Channel **<#${interface_channel.id}>** and Join To Create Channel **<#${jtc_channel.id}>** created under category **${category.name}**. Only <@&1292473360114122784> can connect.`
      );

      return;
    } catch (error) {
      console.error(
        "There is something wrong with initializing channels: ",
        error
      );
      await interaction.editReply(
        "There is something wrong with initializing channels."
      );
      return;
    }
  },
};
