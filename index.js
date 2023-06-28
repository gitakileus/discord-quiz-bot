const { Client, Collection, GatewayIntentBits } = require("discord.js");

require("dotenv").config();
require("./database/init")();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
  ],
});

client.commands = new Collection();

module.exports = client;

["command", "event"].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});

client.login(process.env.DISCORD_TOKEN);
