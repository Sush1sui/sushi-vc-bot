import { ChannelType, PermissionFlagsBits, VoiceState } from "discord.js";
import { addCustomVC, getAllCategoryJTCs } from "../modules/CategoryJTC";

export default {
  name: "voiceStateUpdate",
  once: false,
  async execute(oldState: VoiceState, newState: VoiceState) {
    try {
      const categoryJTCs = await getAllCategoryJTCs();

      for (const category of categoryJTCs) {
        // User joined a VC
        if (
          !oldState.channel &&
          newState.channel?.id === category.jtc_channel_id
        ) {
          console.log(
            `${newState.member?.user.tag} joined ${newState.channel.name}`
          );

          // ✅ Create a temporary channel for the user
          const newCustomVC = await newState.guild.channels.create({
            name: `${newState.member?.user.username}'s Channel`,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parentId!,
            permissionOverwrites: [
              {
                id: newState.guild.id,
                deny: [PermissionFlagsBits.Connect],
              },
              {
                id: newState.member!.id,
                allow: [
                  PermissionFlagsBits.Connect,
                  PermissionFlagsBits.Speak,
                  PermissionFlagsBits.ManageChannels,
                ],
              },
            ],
          });

          // ✅ Move the user to the new channel
          await newState.member?.voice.setChannel(newCustomVC);

          console.log(
            `Created temporary channel ${newCustomVC.name} for ${newState.member?.user.tag}`
          );

          const updatedCategory = await addCustomVC(
            category.id,
            newCustomVC.id
          );
          if (!updatedCategory) {
            throw new Error("Creating custom VC is having error/s");
          }
        }
      }
    } catch (error) {
      console.error(
        `Error handling voice state update: ${(error as Error).message}`
      );
    }
  },
};
