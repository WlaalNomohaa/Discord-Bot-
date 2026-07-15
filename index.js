const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Pool } = require('pg');

// 1. DATABASE SETUP
const pool = new Pool({
    connectionString: 'postgresql://postgres:WJqJPWSoEkhvNpLgkTITbtNRuVxnMWce@interchange.proxy.rlwy.net:59942/railway',
    ssl: { rejectUnauthorized: false }
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// 2. SLASH COMMANDS (Waan saxay qaybtii ValidationError)
const commands = [
    new SlashCommandBuilder().setName('help').setDescription('Macluumaadka bot-ka.'),
    new SlashCommandBuilder().setName('clean').setDescription('Tirtir farriimo')
        .addIntegerOption(o => o.setName('amount').setDescription('Tirada 1-100').setRequired(true)),
    new SlashCommandBuilder().setName('antlinks').setDescription('Tirtir link-yada (On/Off)')
        .addStringOption(o => o.setName('status').setDescription('Dooro On ama Off').addChoices({name: 'On', value: 'on'}, {name: 'Off', value: 'off'}).setRequired(true)),
    new SlashCommandBuilder().setName('setwelcome').setDescription('Soo dhoweyn')
        .addChannelOption(o => o.setName('channel').setDescription('Dooro channel').setRequired(true))
        .addStringOption(o => o.setName('text').setDescription('Farriin {user}').setRequired(true)),
    new SlashCommandBuilder().setName('lock').setDescription('Xir channel-ka'),
    new SlashCommandBuilder().setName('unlock').setDescription('Fur channel-ka')
].map(c => c.toJSON());

// 3. READY EVENT
client.once('ready', () => {
    console.log(`✅ Bot-ka wuu socdaa: ${client.user.tag}`);
});

// 4. MESSAGE HANDLER (Anti-Links)
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    
    const linkRegex = /https?:\/\/[^\s]+/gi;
    if (linkRegex.test(message.content)) {
        try {
            const res = await pool.query('SELECT antlinks FROM settings WHERE guild_id = $1', [message.guild.id]);
            if (res.rows.length > 0 && res.rows[0].antlinks === 'on') {
                if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    await message.delete();
                    const m = await message.channel.send(`⚠️ ${message.author}, Link-yada lama oggola!`);
                    setTimeout(() => m.delete(), 3000);
                }
            }
        } catch (e) { console.error('Database Error:', e); }
    }
});

// 5. INTERACTION HANDLER (Amarrada)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'antlinks') {
            const status = interaction.options.getString('status');
            await pool.query('INSERT INTO settings (guild_id, antlinks) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET antlinks = $2', [interaction.guild.id, status]);
            await interaction.reply({ content: `✅ Anti-Links hadda waa **${status}**!`, ephemeral: true });
        }
        else if (interaction.commandName === 'clean') {
            const amount = interaction.options.getInteger('amount');
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `🧹 Waxaa la tirtiray ${deleted.size} farriimood.`, ephemeral: true });
        }
        else if (interaction.commandName === 'lock') {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
            await interaction.reply({ content: '🔒 Channel-kan waa la xiray.', ephemeral: true });
        }
        else if (interaction.commandName === 'unlock') {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
            await interaction.reply({ content: '🔓 Channel-kan waa la furay.', ephemeral: true });
        }
    } catch (e) {
        console.error(e);
        if (!interaction.replied) await interaction.reply({ content: '❌ Khalad ayaa dhacay.', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
