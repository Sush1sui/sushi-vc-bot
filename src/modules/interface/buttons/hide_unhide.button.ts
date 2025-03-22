import { ButtonInteraction, VoiceChannel } from "discord.js";
import { finest_roleID } from "../../../app";
import { findOwnCustomVC } from "../../CategoryJTC";
import { RETRY_DELAY } from "../interface_button_functions";

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
    await interaction.editReply({
      content: "Something went wrong, please talk to the dev.",
    });
    return;
  }

  const finestRole = interaction.guild.roles.cache.get(finest_roleID);
  if (!finestRole) {
    console.error("Failed to fetch finest role.");
    await interaction.editReply({
      content: "Something went wrong, please talk to the dev.",
    });
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
