import { ChannelType, PermissionFlagsBits, VoiceState } from "discord.js";
import { addCustomVC, getAllCategoryJTCs } from "../modules/CategoryJTC";

export default {
  name: "voiceStateUpdate",
  once: false,
  async execute(oldState: VoiceState, newState: VoiceState) {
    try {
      const categoryJTCs = await getAllCategoryJTCs();

      for (const category of categoryJTCs) {
        // User joined or was moved to a JTC channel
        if (
          (!oldState.channel || oldState.channel.id !== newState.channel?.id) &&
          newState.channel?.id === category.jtc_channel_id
        ) {
          console.log(
            `${newState.member?.user.tag} joined ${newState.channel.name}`
          );

          // ✅ Create a temporary channel for the user
          const newCustomVC = await newState.guild.channels.create({
            name: `${newState.member?.user.displayName}'s VC`,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parentId!,
            permissionOverwrites: [
              {
                id: newState.guild.id,
                deny: [
                  PermissionFlagsBits.Connect,
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                ],
                allow: [],
              },
              {
                id: newState.member!.id,
                allow: [
                  PermissionFlagsBits.Connect,
                  PermissionFlagsBits.Speak,
                  PermissionFlagsBits.ManageChannels,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
                deny: [],
              },
              {
                id: "1292473360114122784", // Finest Role,
                allow: [
                  PermissionFlagsBits.Connect,
                  PermissionFlagsBits.Speak,
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
                deny: [],
              },
            ],
          });

          // ✅ Move the user to the new channel
          await newState.member?.voice.setChannel(newCustomVC);

          console.log(
            `Created temporary channel ${newCustomVC.name} for ${newState.member?.user.tag}`
          );

          const updatedCategory = await addCustomVC(
            category.channel_id,
            newCustomVC.id,
            newState.member?.id!
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
