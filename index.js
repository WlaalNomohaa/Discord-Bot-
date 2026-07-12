const { Client: DiscordClient, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Client: PGClient } = require('pg');

// 1. ISKU-XIRKA POSTGRESQL (RAILWAY)
const connectionString = 'postgresql://postgres:uWTuYDFIZxZjVCFeyPsnMANPpBMQKbiV@tokaido.proxy.rlwy.net:43400/railway';

const pgClient = new PGClient({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Muhiim u ah isku-xirka Railway dushiisa
});

pgClient.connect()
    .then(() => {
        console.log('🎯 Si guul leh ayuu bot-ku ugu xirmay Postgres Database (Railway)!');
        // Abuurista Tables-ka haddii aysan jirin
        return pgClient.query(`
            CREATE TABLE IF NOT EXISTS welcome (
                guild_id TEXT PRIMARY KEY,
                channel_id TEXT,
                message_text TEXT
            );
            CREATE TABLE IF NOT EXISTS spam (
                guild_id TEXT PRIMARY KEY,
                words TEXT[]
            );
        `);
    })
    .then(() => console.log('✅ Tables-kii database-ka waa ay diyaar yihiin!'))
    .catch(err => console.error('❌ Khalad ayaa dhacay marka lala xiriirayay Postgres:', err));

// Bilaabista Client-ka Discord-ka
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

// 2. Diyaarinta dhamaan amarrada (Slash Commands)
const commands = [
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Wuxuu DM kuugu soo dirayaa macluumaadka bot-ka iyo amarradiisa.'),

    new SlashCommandBuilder()
        .setName('clean')
        .setDescription('Ka tirtir channel-ka dhowr farriimood hal mara (Admins Only).')
        .addIntegerOption(option => option.setName('amount').setDescription('Inta farriimood oo la tirtirayo (1-100)').setRequired(true)),

    new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Habee farriinta soo dhoweynta xubnaha cuzub (Admins Only).')
        .addChannelOption(option => option.setName('channel').setDescription('Dooro channel-ka').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addStringOption(option => option.setName('text').setDescription('Qor farriinta. Isticmaal {user} iyo {server}').setRequired(true)),

    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Ku dar erayada mamnuuca ah ee la tirtirayo (Admins Only).')
        .addStringOption(option => option.setName('word').setDescription('Qor erayga ama jumlada mamnuuca ah').setRequired(true)),

    new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Xir channel-ka aad joogto si aan fariin loogu qori karin (Admins Only).'),

    new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Foor channel xirnaa si fariin loogu qoro mar kale (Admins Only).'),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Server-ka ka saar xubin gaar ah (Admins Only).')
        .addUserOption(option => option.setName('user').setDescription('Dooro qofka la kick gareynayo').setRequired(true)),

    new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Ku xir slowmode channel-ka aad joogto (Admins Only).')
        .addIntegerOption(option => option.setName('seconds').setDescription('Inta ilbiriqsi oo qofku sugayo').setRequired(true)),

    new SlashCommandBuilder()
        .setName('offslowmode')
        .setDescription('Ka qaad slowmode-ka channel-ka aad joogto (Admins Only).')
].map(command => command.toJSON());

const getButtonsRow = () => {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Add Server 🔥')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com/oauth2/authorize?client_id=1525477004005085287&permissions=8&integration_type=0&scope=bot'),
            new ButtonBuilder()
                .setLabel('Contact Support 👍')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com/users/1483111151469465722')
        );
};

// 3. Markii bot-ku uu online soo galo
client.once('ready', async () => {
    console.log(`🎉 Sky 🌟 waa diyaar! ${client.user.tag}`);
    client.user.setActivity('Maamulka Server-ka', { type: ActivityType.Watching });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Bilaabaya diiwaangelinta amarrada...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Dhammaan amarrada si guul leh ayaa loo galiyay! 🔥');
    } catch (error) {
        console.error(error);
    }
});

// 4. Marka Bot-ka lagu daro Server Cusub
client.on('guildCreate', async (guild) => {
    try {
        const owner = await guild.fetchOwner();
        if (!owner) return;

        await owner.send({
            content: `Hi ${owner.user}\nAdd Your Server 🔍\n\nClick the buttons below to add the bot or get support:`,
            components: [getButtonsRow()]
        });
    } catch (err) {
        console.error('Wuu xirnaa DM-ka Owner-ka:', err);
    }
});

// 5. Ka jawaabista Slash Commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, channel, guild, member, user } = interaction;

    // --- /help ---
    if (commandName === 'help') {
        const helpMessage = 
            `Hi ${user} I'm Sky Bot Information 👇\n\n` +
            `/setwelcome - Samey Welcome Message\n` +
            `/clean - Ka tirtir channel-ka farriimaha (1-100)\n` +
            `/kick - User Kick Gareey\n` +
            `/lock - Xir Channel-ka\n` +
            `/unlock - Fur Channel-ka\n` +
            `/slowmode - Saar daqiiqado Channel-ka\n` +
            `/offslowmode - Ka qaad daqiiqadaha\n` +
            `/spam - Xir Hadalada Xun Xun\n\n` +
            `Waqti dhow saaxiib! Waad ku mahadsantahay doorashada aad i dooratay 🔥`;

        try {
            await user.send({ content: helpMessage, components: [getButtonsRow()] });
            await interaction.reply({ content: '✅ Macluumaadka bot-ka waxaa lagugu soo diray DM-kaaga!', ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: '❌ Aad baan uga xumahay, ma kuu soo diri karo DM. Fadlan fur DM-kaaga.', ephemeral: true });
        }
        return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ **Ma haysatid oggolaansho!** Kaliya Maamulayaasha (**Administrator**) ayaa isticmaali kara amarradan.', ephemeral: true });
    }

    // --- /clean ---
    if (commandName === 'clean') {
        const amount = interaction.options.getInteger('amount');
        if (amount < 1 || amount > 100) return interaction.reply({ content: '❌ Fadlan dooro tiro u dhaxeysa 1 ilaa 100 farriimood.', ephemeral: true });

        try {
            const deleted = await channel.bulkDelete(amount, true);
            await interaction.reply({ content: `🧹 Si guul leh ayaa channel-ka looga tirtiray **${deleted.size}** farriimood!`, ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: '❌ Waxaa dhacay khalad marka farriimaha la tirtirayay.', ephemeral: true });
        }
    }

    // --- /setwelcome (POSTGRESQL SAVING) ---
    if (commandName === 'setwelcome') {
        const targetChannel = interaction.options.getChannel('channel');
        const text = interaction.options.getString('text');
        
        try {
            await pgClient.query(`
                INSERT INTO welcome (guild_id, channel_id, message_text)
                VALUES ($1, $2, $3)
                ON CONFLICT (guild_id)
                DO UPDATE SET channel_id = $2, message_text = $3;
            `, [guild.id, targetChannel.id, text]);
            
            await interaction.reply({ content: `✅ Si guul leh ayaa PostgreSQL Railway loogu kaydiyey soo dhoweynta! Channel: ${targetChannel}.`, ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '❌ Khalad ayaa dhacay marka xogta la kaydinayay.', ephemeral: true });
        }
    }

    // --- /spam (POSTGRESQL SAVING) ---
    if (commandName === 'spam') {
        const word = interaction.options.getString('word').toLowerCase().trim();
        
        try {
            // Hubi haddii uu jiro server-kan
            const res = await pgClient.query('SELECT words FROM spam WHERE guild_id = $1', [guild.id]);
            
            if (res.rows.length === 0) {
                await pgClient.query('INSERT INTO spam (guild_id, words) VALUES ($1, $2)', [guild.id, [word]]);
            } else {
                const existingWords = res.rows[0].words || [];
                if (!existingWords.includes(word)) {
                    existingWords.push(word);
                    await pgClient.query('UPDATE spam SET words = $2 WHERE guild_id = $1', [guild.id, existingWords]);
                }
            }
            await interaction.reply({ content: `🔒 Erayga **"${word}"** waa la mamnuucay, si rasmiga ahna Postgres ayaa loogu kaydiyey!`, ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '❌ Khalad ayaa dhacay marka xogta la kaydinayay.', ephemeral: true });
        }
    }

    // --- /lock ---
    if (commandName === 'lock') {
        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
            await interaction.reply({ content: '🔒 **Channel-kan waa la xiray!**', ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: '❌ Waxaa dhacay khalad.', ephemeral: true });
        }
    }

    // --- /unlock ---
    if (commandName === 'unlock') {
        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
            await interaction.reply({ content: '🔓 **Channel-kan waa la furay!**', ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: '❌ Waxaa dhacay khalad.', ephemeral: true });
        }
    }

    // --- /kick ---
    if (commandName === 'kick') {
        const targetUser = interaction.options.getUser('user');
        const targetMember = guild.members.cache.get(targetUser.id);
        if (!targetMember || !targetMember.kickable) return interaction.reply({ content: '❌ Qofkan ma kick gareyn karo.', ephemeral: true });
        
        await targetMember.kick();
        await interaction.reply({ content: `👢 **${targetUser.tag}** si guul leh ayaa looga kick gareeyey!`, ephemeral: true });
    }

    // --- /slowmode ---
    if (commandName === 'slowmode') {
        const seconds = interaction.options.getInteger('seconds');
        await channel.setRateLimitPerUser(seconds);
        await interaction.reply({ content: `⏱️ Slowmode-ka waxaa lagu xiray **${seconds}** ilbiriqsi.`, ephemeral: true });
    }

    // --- /offslowmode ---
    if (commandName === 'offslowmode') {
        await channel.setRateLimitPerUser(0);
        await interaction.reply({ content: '⏱️ Slowmode-ka si guul leh ayaa looga qaaday!', ephemeral: true });
    }
});

// 6. Qabashada fariimaha (Spam & DM Auto-Responder)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // --- QAYBTA DM-KA ---
    if (message.channel.type === ChannelType.DM) {
        try {
            const dmRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Add Server 🔥')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.com/oauth2/authorize?client_id=1525477004005085287&permissions=8&integration_type=0&scope=bot')
            );
            await message.author.send({ content: `Hi ${message.author}\nUse / I'm Working! or Add Your Server 🔍`, components: [dmRow] });
        } catch (err) {
            console.error(err);
        }
        return;
    }

    // --- QAYBTA SERVER SPAM-KA ---
    if (!message.guild || !message.member) return;
    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    try {
        const res = await pgClient.query('SELECT words FROM spam WHERE guild_id = $1', [message.guild.id]);
        if (res.rows.length === 0) return;

        const words = res.rows[0].words || [];
        if (words.length === 0) return;

        const contentLower = message.content.toLowerCase();
        const hasSpam = words.some(word => contentLower.includes(word));

        if (hasSpam) {
            await message.delete(); 
            const warning = await message.channel.send(`⚠️ ${message.author}, farriintaada waa la tirtiray sababtoo ah waxay ka kooban tahay eray mamnuuc ah!`);
            setTimeout(() => warning.delete().catch(() => null), 5000); 
        }
    } catch (err) {
        console.error(err);
    }
});

// 7. Nidaamka soo dhoweynta (Welcome)
client.on('guildMemberAdd', async member => {
    try {
        const res = await pgClient.query('SELECT channel_id, message_text FROM welcome WHERE guild_id = $1', [member.guild.id]);
        if (res.rows.length === 0) return;

        const config = res.rows[0];
        const welcomeChannel = member.guild.channels.cache.get(config.channel_id);
        if (!welcomeChannel) return;

        let msg = config.message_text
            .replace(/{user}/g, `${member}`)
            .replace(/{server}/g, `${member.guild.name}`);

        welcomeChannel.send(msg);
    } catch (err) {
        console.error(err);
    }
});

client.login(process.env.DISCORD_TOKEN);
