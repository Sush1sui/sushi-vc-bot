import { ButtonInteraction, VoiceChannel } from "discord.js";
import { finest_roleID } from "../../../app";
import { findOwnCustomVC } from "../../CategoryJTC";
import {
  RETRY_DELAY,
  renameCount,
  MAX_RENAMES,
  renameCooldown,
  COOLDOWN_PERIOD,
} from "../interface_button_functions";

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
