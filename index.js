const { Client, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Pool } = require('pg');

// 1. ISKU-XIRKA DATABASE (Isticmaal environment variable)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

// 2. DIWAANGELINTA COMMANDS
const commands = [
    new SlashCommandBuilder().setName('help').setDescription('Macluumaadka bot-ka.'),
    new SlashCommandBuilder().setName('clean').setDescription('Tirtir farriimo (1-100)')
        .addIntegerOption(o => o.setName('amount').setDescription('Tiro').setRequired(true)),
    new SlashCommandBuilder().setName('antlinks').setDescription('Tirtir link-yada (On/Off)')
        .addStringOption(o => o.setName('status').addChoices({name: 'On', value: 'on'}, {name: 'Off', value: 'off'}).setRequired(true)),
    new SlashCommandBuilder().setName('setwelcome').setDescription('Soo dhoweyn')
        .addChannelOption(o => o.setName('channel').setRequired(true))
        .addStringOption(o => o.setName('text').setRequired(true)),
    new SlashCommandBuilder().setName('lock').setDescription('Xir channel-ka.'),
    new SlashCommandBuilder().setName('unlock').setDescription('Fur channel-ka.')
].map(c => c.toJSON());

// 3. READY EVENT
client.once('ready', async () => {
    console.log(`✅ Sky 🌟 waa online: ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

// 4. MESSAGE HANDLER (Spam & AntiLinks)
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    // Anti-Links Logic
    const linkRegex = /https?:\/\/[^\s]+/gi;
    try {
        const res = await pool.query('SELECT antlinks FROM settings WHERE guild_id = $1', [message.guild.id]);
        if (res.rows.length > 0 && res.rows[0].antlinks === 'on' && linkRegex.test(message.content)) {
            await message.delete();
            return message.channel.send(`⚠️ ${message.author}, Link-yada lama oggola!`).then(m => setTimeout(() => m.delete(), 3000));
        }
    } catch (e) { console.error(e); }
});

// 5. INTERACTION HANDLER (Amarrada)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'antlinks') {
            const status = interaction.options.getString('status');
            await pool.query('INSERT INTO settings (guild_id, antlinks) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET antlinks = $2', [interaction.guild.id, status]);
            await interaction.reply({ content: `✅ Anti-Links hadda waa ${status}`, ephemeral: true });
        }
        
        if (interaction.commandName === 'clean') {
            const amount = interaction.options.getInteger('amount');
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `🧹 Waxaa la tirtiray ${deleted.size} farriimood.`, ephemeral: true });
        }

        if (interaction.commandName === 'lock') {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
            await interaction.reply({ content: '🔒 Channel-kan waa la xiray.', ephemeral: true });
        }

        if (interaction.commandName === 'unlock') {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
            await interaction.reply({ content: '🔓 Channel-kan waa la furay.', ephemeral: true });
        }
    } catch (e) {
        console.error(e);
        if (!interaction.replied) await interaction.reply({ content: '❌ Khalad ayaa dhacay.', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
