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
          } // else {
          //   // Verify if the person who left was the owner
          //   const oldOwner = oldState.member;
          //   if (
          //     oldOwner &&
          //     channel
          //       .permissionsFor(oldOwner)
          //       ?.has(PermissionFlagsBits.ManageChannels)
          //   ) {
          //     console.log(
          //       `${oldOwner.user.tag} was the owner of ${channel.name}`
          //     );

          //     // ✅ Find a new owner among remaining members
          //     const members = Array.from(channel.members.values());
          //     const newOwner = members[0]; // First available member becomes the new owner

          //     if (newOwner) {
          //       console.log(`Transferring ownership to ${newOwner.user.tag}`);

          //       // ✅ Remove ManageChannels permission from the old owner
          //       await channel.permissionOverwrites.edit(oldOwner.id, {
          //         ManageChannels: false,
          //       });

          //       // ✅ Grant ManageChannels permission to the new owner
          //       await channel.permissionOverwrites.edit(newOwner.id, {
          //         ManageChannels: true,
          //       });

          //       // ✅ Update the database with the new owner
          //       await changeOwnerCustomVC(channel.id, newOwner.id);

          //       console.log(`Ownership transferred to ${newOwner.user.tag}`);

          //       await channel.setName(`${newOwner.displayName}'s VC`);
          //     }
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
