import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  VoiceChannel,
} from "discord.js";
import { deleteCategory, findCategory } from "../../modules/CategoryJTC";

export default {
  data: new SlashCommandBuilder()
    .setName("delete_initialized_category")
    .setDescription(
      "Delete the JTC, Interface, and custom vcs if there are any, in a category"
    )
    .addStringOption((option) =>
      option
        .setName("category_id")
        .setDescription("The ID of the Category you want to delete")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const member = interaction.member;
      if (!member || !interaction.guild) {
        await interaction.reply({
          content: "This command can only be used in a guild.",
          ephemeral: true,
        });
        return;
      }
      await interaction.deferReply();
      await interaction.editReply("Deleting channels... please wait.");

      const category_id = interaction.options.getString("category_id")!;

      const JTCCategory = await findCategory(category_id);
      if (!JTCCategory) {
        await interaction.editReply(
          "Category not found, please enter a correct category ID or maybe the category does not have initialized JTC and interface channels from me."
        );
        return;
      }

      const jtc_channel = await interaction.guild.channels.fetch(
        JTCCategory.jtc_channel_id
      );
      const interface_channel = await interaction.guild.channels.fetch(
        JTCCategory.interface_id
      );

      await Promise.all([
        jtc_channel
          ?.delete()
          .catch((err) =>
            console.error(`Failed to delete JTC channel: ${err.message}`)
          ),
        interface_channel
          ?.delete()
          .catch((err) =>
            console.error(`Failed to delete interface channel: ${err.message}`)
          ),
        ...JTCCategory.custom_vcs_id.map((vc_id) =>
          interaction.guild?.channels
            .fetch(vc_id)
            .then((channel) => (channel as VoiceChannel).delete())
            .catch((err) =>
              console.error(`Failed to delete custom VC: ${err.message}`)
            )
        ),
      ]);

      await deleteCategory(category_id);

      await interaction.editReply("Channels deleted successfully.");
      console.log("Channels deleted successfully.");
    } catch (error) {
      console.error("Error deleting channels:", error);
      await interaction.editReply(
        "There is something wrong with deleting initialized channels."
      );
      return;
    }
  },
};
