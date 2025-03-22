import { ButtonInteraction, VoiceChannel } from "discord.js";
import { finest_roleID } from "../../../app";
import { findOwnCustomVC } from "../../CategoryJTC";
import {
  COOLDOWN_PERIOD,
  MAX_RENAMES,
  renameCooldown,
  renameCount,
  RETRY_DELAY,
} from "../interface_button_functions";

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
