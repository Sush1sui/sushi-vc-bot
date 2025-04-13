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
} from "../../modules/interface/interface_template";
import { lockVC } from "../../modules/interface/buttons/lockVC";
import { unlockVC } from "../../modules/interface/buttons/unlockVC.button";
import { hide_unhide_VC } from "../../modules/interface/buttons/hide_unhide.button";
import { limitVC } from "../../modules/interface/buttons/limitVC";
import { inviteVC } from "../../modules/interface/buttons/invite.button";
import { blacklist } from "../../modules/interface/buttons/blacklist.button";
import { permitVC } from "../../modules/interface/buttons/permitVC.button";
import { promptRenameVC } from "../../modules/interface/buttons/renameVC.button";
import { claimVC } from "../../modules/interface/buttons/claimVC.button";
import { transferOwnership } from "../../modules/interface/buttons/transferOwnership.button";

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
          flags: "Ephemeral",
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

        const member = await interaction_button.guild?.members.fetch(
          interaction_button.user.id
        );

        // Check if the user is NOT in a voice channel
        if (!member?.voice.channelId) {
          await interaction_button.reply({
            content:
              "**You need to be in a voice channel to use this button.**",
            flags: "Ephemeral",
          });
          return;
        }

        if (interface_channel.parentId !== member.voice.channel?.parentId) {
          await interaction.reply({
            content:
              "**You need to be in a voice channel from my VC interface.**",
            flags: "Ephemeral",
          });
          return;
        }

        switch (interaction_button.customId) {
          case "lock_vc":
            lockVC(interaction_button);
            break;
          case "unlock_vc":
            unlockVC(interaction_button);
            break;
          case "hide":
            await hide_unhide_VC(interaction_button, "hide");
            break;
          case "unhide":
            await hide_unhide_VC(interaction_button);
            break;
          case "limit":
            await limitVC(interaction_button);
            break;
          case "invite":
            await inviteVC(interaction_button);
            break;
          case "blacklist":
            await blacklist(interaction_button);
            break;
          case "permit":
            await permitVC(interaction_button);
            break;
          case "rename":
            await promptRenameVC(interaction_button);
            break;
          case "claim_vc":
            await claimVC(interaction_button);
            break;
          case "transfer_owner":
            await transferOwnership(interaction_button);
            break;
          default:
            break;
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
