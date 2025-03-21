import {
  ActionRowBuilder,
  ButtonInteraction,
  ChannelType,
  Client,
  EmbedBuilder,
  GuildMember,
  ModalBuilder,
  ModalSubmitInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  User,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
  VoiceChannel,
} from "discord.js";
import { finest_roleID } from "../app";
import {
  changeOwnerCustomVC,
  findCustomVC,
  findOwnCustomVC,
  getAllCategoryJTCs,
} from "./CategoryJTC";

const RETRY_DELAY = 3000; // 3 seconds
const renameCount = new Map<string, number>();
const renameCooldown = new Map<string, NodeJS.Timeout>();
const MAX_RENAMES = 2;
const COOLDOWN_PERIOD = 10 * 60 * 1000; // 10 minutes

export async function initializeButtonCollector(client: Client) {
  try {
    const JTCCategories = await getAllCategoryJTCs();

    for (const category of JTCCategories) {
      const interface_channel = (await client.channels.fetch(
        category.interface_id
      )) as TextChannel;

      if (interface_channel) {
        const interface_message = await interface_channel.messages.fetch(
          category.interface_message_id
        );

        const collector = interface_message.createMessageComponentCollector();

        collector.on("collect", async (interaction: ButtonInteraction) => {
          if (!interaction.isButton()) return;

          console.log(`Interaction received: ${interaction.customId}`);

          if (interaction.customId === "lock_vc") {
            lockVC(interaction);
          } else if (interaction.customId === "unlock_vc") {
            unlockVC(interaction);
          } else if (interaction.customId === "hide") {
            await hide_unhide_VC(interaction, "hide");
          } else if (interaction.customId === "unhide") {
            await hide_unhide_VC(interaction);
          } else if (interaction.customId === "limit") {
            await limitVC(interaction);
          } else if (interaction.customId === "invite") {
            await inviteVC(interaction);
          } else if (interaction.customId === "blacklist") {
            await blacklist(interaction);
          } else if (interaction.customId === "permit") {
            await permitVC(interaction);
          } else if (interaction.customId === "rename") {
            await promptRenameVC(interaction);
          } else if (interaction.customId === "claim_vc") {
            await claimVC(interaction);
          } else if (interaction.customId === "transfer_owner") {
            await transferOwnership(interaction);
          }
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

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

export async function hide_unhide_VC(
  interaction: ButtonInteraction,
  type = ""
) {
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

  const finestRole = interaction.guild.roles.cache.get(finest_roleID);
  if (!finestRole) {
    console.error("Failed to fetch finest role.");
    return;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

    await customVC.permissionOverwrites.edit(finestRole.id, {
      ViewChannel: type === "hide" ? false : true,
    });

    await interaction.editReply({
      content: `**VC: ${customVC.name} now ${
        type === "hide" ? "hidden" : "unhidden"
      }.**`,
    });
    console.log(
      `VC: ${customVC.name} now ${type === "hide" ? "hidden" : "unhidden"}`
    );
    return;
  } catch (error) {
    console.error(`Error hiding VC: ${(error as Error).message}`);
    await interaction.editReply({
      content: `**Failed to ${type === "hide" ? "hide" : "unhide"} VC.**`,
    });
  }
}

export async function lockVC(interaction: ButtonInteraction) {
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

  const finestRole = interaction.guild.roles.cache.get(finest_roleID);
  if (!finestRole) {
    console.error("Failed to fetch finest role.");
    return;
  }

  if (
    !customVC
      .permissionsFor(interaction.client.user!)
      ?.has(["ManageChannels", "ManageRoles"])
  ) {
    await interaction.editReply({
      content: "**🚫 Bot does not have permission to manage this channel.**",
    });
    return;
  }

  try {
    // ✅ Add a small delay before renaming to avoid rate limit
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

    // 👉 Track rename count
    const currentRenames = renameCount.get(customVC.id) || 0;
    if (currentRenames >= MAX_RENAMES) {
      console.log(
        `Rename limit reached for ${customVC.name}, skipping rename.`
      );

      // Only update permissions without renaming
      await customVC.permissionOverwrites.edit(finestRole.id, {
        Connect: false,
        SendMessages: false,
      });

      await interaction.editReply({
        content:
          "**🔒 VC locked (rename limit reached). Permissions updated only.**",
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

    // ✅ Rename and update permissions
    await customVC.edit({
      name: `🔒 | ${interaction.user.displayName}'s VC`,
      permissionOverwrites: [
        {
          id: finestRole.id,
          deny: ["Connect", "SendMessages"],
          allow: ["Speak", "ReadMessageHistory", "ViewChannel"],
        },
        {
          id: member.user.id,
          allow: [
            "Connect",
            "SendMessages",
            "Speak",
            "ManageChannels",
            "ReadMessageHistory",
          ],
        },
        {
          id: interaction.guild.roles.everyone.id,
          deny: ["ViewChannel"],
        },
      ],
    });

    await interaction.editReply({
      content: "**🔒 VC locked successfully**",
    });

    console.log(`Locked VC for ${customVC.name}`);
  } catch (error) {
    console.error(`Error locking VC: ${(error as Error).message}`);
    await interaction.editReply({
      content: "**Failed to lock VC.**",
    });
  }
}

export async function unlockVC(interaction: ButtonInteraction) {
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

  const finestRole = interaction.guild.roles.cache.get(finest_roleID);
  if (!finestRole) {
    console.error("Failed to fetch finest role.");
    return;
  }

  if (
    !customVC
      .permissionsFor(interaction.client.user!)
      ?.has(["ManageChannels", "ManageRoles"])
  ) {
    await interaction.editReply({
      content: "**🚫 Bot does not have permission to manage this channel.**",
    });
    return;
  }

  try {
    // ✅ Add delay to avoid rate limit
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

    // 👉 Check rename limit
    const currentRenames = renameCount.get(customVC.id) || 0;
    if (currentRenames >= MAX_RENAMES) {
      console.log(
        `Rename limit reached for ${customVC.name}, skipping rename.`
      );

      // Only update permissions
      await customVC.permissionOverwrites.edit(finestRole.id, {
        Connect: true,
        SendMessages: true,
      });

      await interaction.editReply({
        content:
          "**🔓 VC unlocked (rename limit reached). Permissions updated only.**",
      });
      return;
    }

    // ✅ Increment rename count
    renameCount.set(customVC.id, currentRenames + 1);

    // ✅ Start cooldown timer if this is the last rename
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

    // ✅ Rename and update permissions
    await customVC.edit({
      name: `${interaction.user.displayName}'s VC`,
      permissionOverwrites: [
        {
          id: finestRole.id,
          allow: [
            "Connect",
            "SendMessages",
            "Speak",
            "ReadMessageHistory",
            "ViewChannel",
          ],
        },
        {
          id: member.user.id,
          allow: [
            "Connect",
            "SendMessages",
            "Speak",
            "ManageChannels",
            "ReadMessageHistory",
          ],
        },
        {
          id: interaction.guild.roles.everyone.id,
          deny: ["ViewChannel"],
        },
      ],
    });

    await interaction.editReply({
      content: "**🔓 VC unlocked successfully**",
    });

    console.log(`Unlocked VC for ${customVC.name}`);
  } catch (error) {
    console.error(`Error unlocking VC: ${(error as Error).message}`);
    await interaction.editReply({
      content: "**Failed to unlock VC.**",
    });
  }
}
