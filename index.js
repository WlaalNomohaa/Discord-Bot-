const { Client, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds] // Slash commands kaliya 'Guilds' ayay u baahan yihiin
});

client.once(Events.ClientReady, c => {
    console.log(`Bot-ka waa diyaar! Magaca waa: ${c.user.tag}`);
});

// Halkan bot-ku wuxuu ka jawaabayaa Slash Commands-ka
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'hello') {
        await interaction.reply('Asc! Bot-kaaga Universal-ka ah waa diyaar. Maxaan ku caawiyaa?');
    }
});

client.login(process.env.DISCORD_TOKEN);
