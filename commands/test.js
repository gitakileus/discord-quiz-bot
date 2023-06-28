const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Start a quiz"),
  async execute(client, interaction) {
    // Create the quiz embed
    const quizEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Quiz Time!")
      .setDescription(`What is the capital of Sweden?`)
      .setFooter({ text: "Time allowed: 5 seconds" });

    const sentMessage = await interaction.reply({
      embeds: [quizEmbed],
      fetchReply: true,
    });
    const reactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
    reactions.forEach((reaction) => sentMessage.react(reaction));

    const filter = (reaction, user) =>
      user.id === interaction.user.id &&
      reactions.includes(reaction.emoji.name) &&
      !user.bot;
    let reactionCount = 0;

    const collector = sentMessage.createReactionCollector({
      filter,
      time: 5000,
    });

    collector.on("collect", () => {
      reactionCount++;
      if (reactionCount === reactions.length) {
        collector.stop();
      }

      sentMessage.reactions.removeAll().catch(console.error);
    });

    collector.on("end", () => {
      // Update the embed with answers
      const answerFields = [
        { name: "1️⃣", value: "Stockholm" },
        { name: "2️⃣", value: "Oslo" },
        { name: "3️⃣", value: "Helsinki" },
        { name: "4️⃣", value: "Copenhagen" },
        { name: "1️⃣", value: "Reykjavik" },
      ];

      const answer = answerFields
        .map((option, index) => `${option.name} ${option.value}`)
        .join("\n");

      quizEmbed.addFields({ name: "Answers", value: answer, inline: true });

      // Edit the message with the updated embed
      sentMessage.edit({ embeds: [quizEmbed] });

      const answerCollector = sentMessage.createReactionCollector(filter, {
        time: 5000,
      });

      answerCollector.on("collect", (reaction, user) => {
        // Check if the user's reaction matches the correct answer
        const correctAnswerIndex = reactions.indexOf(reaction.emoji.name);
        const isCorrect = correctAnswerIndex === 2;

        // Create the result embed
        const resultEmbed = new EmbedBuilder()
          .setColor(isCorrect ? "#00ff00" : "#ff0000")
          .setTitle(isCorrect ? "Correct Answer!" : "Wrong Answer!")
          .addFields({
            name: "Your Answer",
            value: answerFields[correctAnswerIndex].value,
          })
          .addFields({ name: "Correct Answer", value: answerFields[2].value });

        // Send the result embed as a reply to the user
        sentMessage.channel
          .send({ embeds: [resultEmbed] })
          .catch(console.error);

        // sentMessage.reactions.removeAll().catch(console.error);
        answerCollector.stop();
      });
    });
  },
};
