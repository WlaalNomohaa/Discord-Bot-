const { Client: DiscordClient, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Pool } = require('pg'); // Isticmaal Pool halkii aad ka isticmaali lahayd Client

const connectionString = 'postgresql://postgres:uWTuYDFIZxZjVCFeyPsnMANPpBMQKbiV@tokaido.proxy.rlwy.net:43400/railway';

// Pool waa ka ammaan badan yahay Connection-ka caadiga ah
const pgPool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

const client = new DiscordClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
    partials: ['Channel']
});

// 1. DIIWAANGELINTA AMARADA OO DHAN
const commands = [
    new SlashCommandBuilder().setName('help').setDescription('Macluumaadka bot-ka.'),
    new SlashCommandBuilder().setName('clean').setDescription('Tirtir farriimo.')
        .addIntegerOption(o => o.setName('amount').setDescription('Tirada (1-100)').setRequired(true)),
    new SlashCommandBuilder().setName('setwelcome').setDescription('Soo dhoweyn.')
        .addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true))
        .addStringOption(o => o.setName('text').setDescription('Farriin ({user}, {server})').setRequired(true)),
    new SlashCommandBuilder().setName('spam').setDescription('Erayo mamnuuc ah.')
        .addStringOption(o => o.setName('word').setDescription('Erayada').setRequired(true)),
    new SlashCommandBuilder().setName('antlinks').setDescription('Tirtir link-yada (On/Off)')
        .addStringOption(o => o.setName('status').setDescription('Dooro').addChoices({name: 'On', value: 'on'}, {name: 'Off', value: 'off'}).setRequired(true)),
    new SlashCommandBuilder().setName('lock').setDescription('Xir channel-ka.'),
    new SlashCommandBuilder().setName('unlock').setDescription('Fur channel-ka.'),
    new SlashCommandBuilder().setName('kick').setDescription('Kick user')
        .addUserOption(o => o.setName('user').setDescription('Qofka').setRequired(true)),
    new SlashCommandBuilder().setName('slowmode').setDescription('Slowmode').addIntegerOption(o => o.setName('seconds').setRequired(true)),
    new SlashCommandBuilder().setName('offslowmode').setDescription('Ka qaad slowmode.')
].map(c => c.toJSON());

// 2. LOGIC-GA FARIIMAHA (SPAM & ANTLINKS)
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    // --- ANTLINKS LOGIC ---
    const linkRegex = /https?:\/\/[^\s]+/gi;
    const resLinks = await pgPool.query('SELECT antlinks FROM settings WHERE guild_id = $1', [message.guild.id]);
    if (resLinks.rows.length > 0 && resLinks.rows[0].antlinks === 'on') {
        if (linkRegex.test(message.content)) {
            await message.delete();
            return message.channel.send(`⚠️ ${message.author}, Link-yada lama oggola server-kan!`).then(m => setTimeout(() => m.delete(), 3000));
        }
    }

    // --- SPAM LOGIC ---
    const resSpam = await pgPool.query('SELECT words FROM spam WHERE guild_id = $1', [message.guild.id]);
    if (resSpam.rows.length > 0) {
        const words = resSpam.rows[0].words;
        if (words.some(w => message.content.toLowerCase().includes(w))) {
            await message.delete();
            const warning = await message.channel.send(`⚠️ ${message.author}, Eray mamnuuc ah ayaa isticmaashay!`);
            setTimeout(() => warning.delete(), 5000);
        }
    }
});

// 3. ISKU-XIRKA AMARADA (Interaction)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- /antlinks (CUSUB) ---
    if (interaction.commandName === 'antlinks') {
        const status = interaction.options.getString('status');
        await pgPool.query(`INSERT INTO settings (guild_id, antlinks) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET antlinks = $2`, [interaction.guild.id, status]);
        await interaction.reply({ content: `✅ Anti-Links hadda waa **${status}**!`, ephemeral: true });
    }
    
    // ... (Halkan ku dar logic-ga kale ee amaradaada sida clean, lock, setwelcome iwm)
});

client.login(process.env.DISCORD_TOKEN);
