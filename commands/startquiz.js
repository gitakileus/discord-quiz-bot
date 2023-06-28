const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startquiz")
    .setDescription("Start a quiz"),
  async execute(client, interaction) {
    // Create the quiz embed
    const quizEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Quiz Panel!")
      .setDescription(`Use this panel to start a quiz?`);

    const confirm = new ButtonBuilder()
      .setCustomId("startquiz")
      .setLabel("Start quiz")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(confirm);

    const sentMessage = await interaction.reply({
      embeds: [quizEmbed],
      components: [row],
      fetchReply: true,
      // ephemeral: true,
    });
  },
};
