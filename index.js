const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Pool } = require('pg');

const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

// DIWAANGELINTA AMARADA OO DHAN (Hubi in magacyadu aysan lahayn meel bannaan/space)
const commands = [
    new SlashCommandBuilder().setName('help').setDescription('Macluumaadka bot-ka.'),
    new SlashCommandBuilder().setName('clean').setDescription('Tirtir farriimo')
        .addIntegerOption(o => o.setName('amount').setDescription('Tirada 1-100').setRequired(true)),
    new SlashCommandBuilder().setName('setwelcome').setDescription('Soo dhoweyn')
        .addChannelOption(o => o.setName('channel').setDescription('Dooro channel').setRequired(true))
        .addStringOption(o => o.setName('text').setDescription('Fariin {user}').setRequired(true)),
    new SlashCommandBuilder().setName('antlinks').setDescription('Tirtir link-yada')
        .addStringOption(o => o.setName('status').setDescription('Dooro On ama Off').addChoices({name: 'On', value: 'on'}, {name: 'Off', value: 'off'}).setRequired(true)),
    new SlashCommandBuilder().setName('lock').setDescription('Xir channel-ka'),
    new SlashCommandBuilder().setName('unlock').setDescription('Fur channel-ka')
].map(c => c.toJSON());

// HADDII KHALADKU U GUDBI WAAYO, BEDDEL REST API-GA SIDAAN:
client.once('ready', async () => {
    console.log(`✅ Bot-ka wuu socdaa: ${client.user.tag}`);
    // Waxaad u baahan tahay inaad hubiso in DISCORD_TOKEN uu yahay mid sax ah oo Environment Variable ah
});

// Qaybta interactionCreate waa ay saxan tahay, laakiin hubi inaad ku darto try/catch
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    try {
        if (interaction.commandName === 'antlinks') {
            const status = interaction.options.getString('status');
            await pgPool.query('INSERT INTO settings (guild_id, antlinks) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET antlinks = $2', [interaction.guild.id, status]);
            await interaction.reply({ content: `✅ Anti-Links hadda waa **${status}**!`, ephemeral: true });
        }
        // Ku dar qaybaha kale halkan...
    } catch (err) {
        console.error('Khalad dhacay:', err);
    }
});

client.login(process.env.DISCORD_TOKEN);
