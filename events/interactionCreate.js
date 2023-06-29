const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} = require("discord.js");
const Quiz = require("../database/model").questions;
const client = require("..");
const { getOrdinal, getRandomColor } = require("../utils/helper");
// const { allowedUsers } = require('../config.json');

let currentTestingMember = 0;

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    // if (allowedUsers.findIndex((user) => user.id === interaction.user.id) === -1) {
    //   return;
    // }
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      // await interaction.deferReply({ ephemeral: true });
      await command.execute(client, interaction);
    } catch (error) {
      console.log(error);
      await interaction.editReply({
        content: "🤔 There was an error while executing this command",
        ephemeral: true,
      });
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === "startquiz") {
      const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
      const startRole = guild.roles.cache.get(
        process.env.DISCORD_QUIZ_START_ROLE
      );
      const doneRole = guild.roles.cache.get(
        process.env.DISCORD_QUIZ_DONE_ROLE
      );
      const discordId = interaction.user.id;
      const member =
        guild.members.cache.get(discordId) ||
        (await guild.members.fetch(discordId));

      // check the current role of the user
      if (member.roles.cache.has(startRole.id)) {
        await interaction.reply({
          content: "You have already started the quiz!",
          ephemeral: true,
        });
        return;
      }
      if (member.roles.cache.has(doneRole.id)) {
        await interaction.reply({
          content: "You have already completed the quiz!",
          ephemeral: true,
        });
        return;
      }
      // check the current testing member
      if (currentTestingMember >= 10) {
        await interaction.reply({
          content: "The quiz is full! Please try again later.",
          ephemeral: true,
        });
        return;
      }

      interaction.reply({
        content: "The quiz has started!",
        ephemeral: false,
      });

      member.roles.add(startRole);

      guild.channels
        .create({
          name: `quiz-channel for ${interaction.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        })
        .then(async (channel) => {
          currentTestingMember++;
          // loop 3 time the question
          let gotCorrectAnswer = false;

          for (let i = 0; i < 3; i++) {
            const randomRecord = await Quiz.aggregate([
              { $sample: { size: 1 } },
            ]);

            gotCorrectAnswer = await runQuiz(
              i,
              randomRecord[0],
              interaction,
              guild,
              channel,
              member
            );

            console.log("gotCorrectAnswer", gotCorrectAnswer);

            if (gotCorrectAnswer) {
              break;
            }
          }

          const doneRole = guild.roles.cache.get(
            process.env.DISCORD_QUIZ_DONE_ROLE
          );
          member.roles.remove(startRole);
          member.roles.add(doneRole);
          currentTestingMember--;

          if (!gotCorrectAnswer) {
            console.log("User didn't get the correct answer in 3 attempts.");
          }
        });
    }
  }
});

async function runQuiz(
  index,
  randomRecord,
  interaction,
  guild,
  channel,
  member
) {
  return new Promise(async (resolve) => {
    const quizEmbed = new EmbedBuilder()
      .setColor(`${getRandomColor()}`)
      .setTitle(`\n${getOrdinal(index)} question \n`)
      .setDescription(`${randomRecord.title}`)
      .setFooter({ text: "Time allowed: 8 seconds" });

    channel.send({ embeds: [quizEmbed] }).then(async (sentMessage) => {
      const select = new StringSelectMenuBuilder()
        .setCustomId("starter")
        .setPlaceholder(`Select your answer`);

      randomRecord.answers.map((answer) => {
        select.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(answer.answer)
            .setValue(answer.answer)
        );
      });

      const row = new ActionRowBuilder().addComponents(select);

      const response = await sentMessage.edit({
        content: ``,
        components: [row],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.SelectMenu,
        time: 9_000,
      });

      // Before starting the collector, send a message with a full progress bar
      let progressBarMessage = await sentMessage.channel.send({
        content: "Starting timer: ▮▮▮▮▮▮▮▮",
      });

      let timer = 8;
      let progressBarInterval = setInterval(() => {
        timer--;
        let progressBar = "";

        for (let i = 0; i < 8; i++) {
          if (i < timer) {
            progressBar += "▮";
          } else {
            progressBar += "▯";
          }
        }

        progressBarMessage.edit({
          content: `Time remaining: ${progressBar}`,
        });
      }, 1000);

      collector.on("collect", async (i) => {
        const selection = i.values[0];
        await i.reply(`${i.user} has selected ${selection}!`);

        const correctAnswer = randomRecord.answers.find(
          (answer) => answer.correct
        );
        const isCorrect = selection === correctAnswer.answer;
        // Create the result embed
        const resultEmbed = new EmbedBuilder()
          .setColor(isCorrect ? "#00ff00" : "#ff0000")
          .setTitle(isCorrect ? "Correct Answer!" : "Wrong Answer!")
          .addFields({
            name: "Your Answer",
            value: selection,
          })
          .addFields({
            name: "Correct Answer",
            value: selection,
          });

        // Send the result embed as a reply to the user
        await sentMessage.channel
          .send({ embeds: [resultEmbed] })
          .catch(console.error);

        // Disable the select menu so the user can't change their answer
        await collector.stop();
        // add the quiz pass role
        if (isCorrect) {
          const quizPassRole = guild.roles.cache.get(
            process.env.DISCORD_QUIZ_PASS_ROLE
          );
          member.roles.add(quizPassRole);

          const quizPassEmbed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("Congratulations!")
            .setDescription(
              `${i.user} has passed the quiz!\n You got the quiz pass role!`
            );
          await sentMessage.channel
            .send({ embeds: [quizPassEmbed] })
            .catch(console.error);
          console.log("User got the correct answer!");
          resolve(true);
        }
        resolve(false);
      });

      collector.on("end", async (collected) => {
        // disable select menu after finish not to select again
        if (collected.size === 0) {
          sentMessage.channel.send(
            `${interaction.user}, you didn't select an answer within 8s!`
          );
          await collector.stop();
          resolve(false);
        }

        clearInterval(progressBarInterval);
        select.setDisabled(true);
        row.components = [];
        row.addComponents(select);
        await sentMessage.edit({ components: [row] });
      });
    });
  });
}
