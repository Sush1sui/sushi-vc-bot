import { ButtonInteraction, Client, TextChannel } from "discord.js";
import { getAllCategoryJTCs } from "../CategoryJTC";
import { transferOwnership } from "./buttons/transferOwnership.button";
import { claimVC } from "./buttons/claimVC.button";
import { promptRenameVC } from "./buttons/renameVC.button";
import { permitVC } from "./buttons/permitVC.button";
import { blacklist } from "./buttons/blacklist.button";
import { inviteVC } from "./buttons/invite.button";
import { limitVC } from "./buttons/limitVC";
import { hide_unhide_VC } from "./buttons/hide_unhide.button";
import { lockVC } from "./buttons/lockVC";
import { unlockVC } from "./buttons/unlockVC.button";

export const RETRY_DELAY = 3000; // 3 seconds
export const renameCount = new Map<string, number>();
export const renameCooldown = new Map<string, NodeJS.Timeout>();
export const MAX_RENAMES = 2;
export const COOLDOWN_PERIOD = 10 * 60 * 1000; // 10 minutes

export async function initializeButtonCollector(client: Client) {
  try {
    const JTCCategories = await getAllCategoryJTCs();

    for (const category of JTCCategories) {
      const interface_channel = (await client.channels.fetch(
        category.interface_id
      )) as TextChannel;

      if (interface_channel) {
        console.log("interface channel:", interface_channel.name);
        console.log(
          `initializing button collectors for ${interface_channel.name}`
        );
        const interface_message = await interface_channel.messages.fetch(
          category.interface_message_id
        );

        const collector = interface_message.createMessageComponentCollector();

        collector.on("collect", async (interaction: ButtonInteraction) => {
          if (!interaction.isButton()) return;

          console.log(`Interaction received: ${interaction.customId}`);

          const member = await interaction.guild?.members.fetch(
            interaction.user.id
          );

          // Check if the user is NOT in a voice channel
          if (!member?.voice.channelId) {
            await interaction.reply({
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

          switch (interaction.customId) {
            case "lock_vc":
              lockVC(interaction);
              break;
            case "unlock_vc":
              unlockVC(interaction);
              break;
            case "hide":
              await hide_unhide_VC(interaction, "hide");
              break;
            case "unhide":
              await hide_unhide_VC(interaction);
              break;
            case "limit":
              await limitVC(interaction);
              break;
            case "invite":
              await inviteVC(interaction);
              break;
            case "blacklist":
              await blacklist(interaction);
              break;
            case "permit":
              await permitVC(interaction);
              break;
            case "rename":
              await promptRenameVC(interaction);
              break;
            case "claim_vc":
              await claimVC(interaction);
              break;
            case "transfer_owner":
              await transferOwnership(interaction);
              break;
            default:
              break;
          }
        });
        console.log(
          `initializing button collectors for ${interface_channel.name} done`
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
}
