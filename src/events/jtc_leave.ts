import { VoiceState } from "discord.js";
import { getAllCategoryJTCs, removeCustomVC } from "../modules/CategoryJTC";

export default {
  name: "voiceStateUpdate",
  once: false,
  async execute(oldState: VoiceState, _newState: VoiceState) {
    try {
      const categoryJTCs = await getAllCategoryJTCs();

      if (!oldState.channel) return;

      const channel = oldState.channel;

      // Check if the channel is tracked
      for (const category of categoryJTCs) {
        if (category.custom_vcs_id.includes(channel.id)) {
          if (channel.members.size === 0) {
            console.log(`Deleting empty channel ${channel.name}`);

            // Remove from the database using $pull
            await removeCustomVC(category.channel_id, channel.id);

            // Delete the channel from Discord
            await channel.delete();

            console.log(`Removed ${channel.id} from database`);
          }

          // else if (channel.members.size === 1) {
          //   // Get the remaining member
          //   const remainingMember = channel.members.first();
          //   if (!remainingMember) return;

          //   // Check if they are not already the owner
          //   const oldOwner = oldState.member;
          //   if (
          //     oldOwner &&
          //     channel
          //       .permissionsFor(oldOwner)
          //       ?.has(PermissionFlagsBits.ManageChannels) &&
          //     oldOwner.id !== remainingMember.id
          //   ) {
          //     console.log(
          //       `${oldOwner.user.tag} left, transferring ownership to ${remainingMember.user.tag}`
          //     );

          //     // Remove ManageChannels and MoveMembers permission from the old owner
          //     await channel.permissionOverwrites.edit(oldOwner.id, {
          //       ManageChannels: false,
          //       MoveMembers: false,
          //     });

          //     // Grant ManageChannels and MoveMembers permission to the new owner
          //     await channel.permissionOverwrites.edit(remainingMember.id, {
          //       ManageChannels: true,
          //       MoveMembers: true,
          //     });

          //     // Update the database with the new owner
          //     await changeOwnerCustomVC(channel.id, remainingMember.id);

          //     console.log(
          //       `Ownership transferred to ${remainingMember.user.tag}`
          //     );
          //   }
          // }
        }
      }
    } catch (error) {
      console.error(
        `Error handling empty channel: ${(error as Error).message}`
      );
    }
  },
};
