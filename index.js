const { Client, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Kaydka kumeel-gaarka ah (RAM)
let welcomeConfigs = {}; 
let spamWords = {}; 

// 1. Diyaarinta dhamaan amarrada (Slash Commands)
const commands = [
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Wuxuu DM kuugu soo dirayaa macluumaadka bot-ka iyo amarradiisa.'),

    new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Habee farriinta soo dhoweynta xubnaha cusub (Admins Only).')
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

// 2. Markii bot-ku uu online soo galo
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

// 3. Marka Bot-ka lagu daro Server Cusub (Guild Create Event)
client.on('guildCreate', async (guild) => {
    try {
        const owner = await guild.fetchOwner();
        if (!owner) return;

        await owner.send(
            `Hi ${owner.user}\n` +
            `Add Your Server 🔍\n\n` +
            `[Add Your Server Bot ⏳](https://discord.com/oauth2/authorize?client_id=1525477004005085287&permissions=8&integration_type=0&scope=bot)`
        );
        console.log(`Farriinta DM-ka waxaa si guul leh loogu diray Owner-ka: ${guild.name}`);
    } catch (err) {
        console.error('Wuu xirnaa DM-ka Owner-ka:', err);
    }
});

// 4. Ka jawaabista Slash Commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, channel, guild, member, user } = interaction;

    // --- /help (Wuxuu u shaqaynayaa qof walba, wuxuuna tagayaa DM) ---
    if (commandName === 'help') {
        const helpMessage = 
            `Hi ${user} I'm Sky Bot Information 👇\n\n` +
            `/setwelcome - Samey Welcome Message\n` +
            `/kick - User Kick Gareey\n` +
            `/lock - Xir Channel-ka\n` +
            `/unlock - Fur Channel-ka\n` +
            `/slowmode - Saar daqiiqado Channel-ka\n` +
            `/offslowmode - Ka qaad daqiiqadaha\n` +
            `/spam - Xir Hadalada Xun Xun\n\n` +
            `Waqti dhow saaxiib! Waad ku mahadsantahay doorashada aad i dooratay 🔥`;

        try {
            await user.send(helpMessage);
            await interaction.reply({ content: '✅ Macluumaadka bot-ka waxaa lagugu soo diray DM-kaaga! Hubi fariimahaaga gaarka ah.', ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: '❌ Aad baan uga xumahay, ma kuu soo diri karo DM. Fadlan fur DM-kaaga.', ephemeral: true });
        }
        return;
    }

    // AMNIGA: Amarrada kale oo dhan waa inay Admins oggolaansho u haystaan
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
            content: '❌ **Ma haysatid oggolaansho!** Kaliya Maamulayaasha (**Administrator**) ee Server-ka ayaa isticmaali kara amarradan.', 
            ephemeral: true 
        });
    }

    // --- /setwelcome ---
    if (commandName === 'setwelcome') {
        const targetChannel = interaction.options.getChannel('channel');
        const text = interaction.options.getString('text');
        
        welcomeConfigs[guild.id] = { channelId: targetChannel.id, messageText: text };
        await interaction.reply({ content: `✅ Si guul leh ayaa loo habeeyay soo dhoweynta! Channel: ${targetChannel}. Text: "${text}"`, ephemeral: true });
    }

    // --- /spam ---
    if (commandName === 'spam') {
        const word = interaction.options.getString('word').toLowerCase().trim();
        
        if (!spamWords[guild.id]) {
            spamWords[guild.id] = [];
        }
        
        if (!spamWords[guild.id].includes(word)) {
            spamWords[guild.id].push(word);
        }
        
        await interaction.reply({ content: `🔒 Erayga **"${word}"** waxaa lagu daray liiska spam-ka ee server-kan laga mamnuucay!`, ephemeral: true });
    }

    // --- /lock (Hadda waa Ephemeral/Private) ---
    if (commandName === 'lock') {
        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
            await interaction.reply({ content: '🔒 **Channel-kan waa la xiray!** Xubnaha caadiga fariin ma qori karaan.', ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: '❌ Waxaa dhacay khalad marka la xirayay channel-ka.', ephemeral: true });
        }
    }

    // --- /unlock (Hadda waa Ephemeral/Private) ---
    if (commandName === 'unlock') {
        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
            await interaction.reply({ content: '🔓 **Channel-kan waa la furay!** Mar kale fariin waa la qori koree.', ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: '❌ Waxaa dhacay khalad marka la furayay channel-ka.', ephemeral: true });
        }
    }

    // --- /kick (Hadda waa Ephemeral/Private) ---
    if (commandName === 'kick') {
        const targetUser = interaction.options.getUser('user');
        const targetMember = guild.members.cache.get(targetUser.id);
        
        if (!targetMember) return interaction.reply({ content: '❌ Qofkan lagama helin server-ka.', ephemeral: true });
        if (!targetMember.kickable) return interaction.reply({ content: '❌ Bot-ku awood uma laha inuu kick gareeyo qofkan.', ephemeral: true });
        
        await targetMember.kick();
        await interaction.reply({ content: `👢 **${targetUser.tag}** si guul leh ayaa looga kick gareeyey server-ka!`, ephemeral: true });
    }

    // --- /slowmode (Hadda waa Ephemeral/Private) ---
    if (commandName === 'slowmode') {
        const seconds = interaction.options.getInteger('seconds');
        await channel.setRateLimitPerUser(seconds);
        await interaction.reply({ content: `⏱️ Slowmode-ka channel-ka waxaa lagu xiray **${seconds}** ilbiriqsi.`, ephemeral: true });
    }

    // --- /offslowmode (Hadda waa Ephemeral/Private) ---
    if (commandName === 'offslowmode') {
        await channel.setRateLimitPerUser(0);
        await interaction.reply({ content: '⏱️ Slowmode-ka si guul leh ayaa looga qaaday channel-ka!', ephemeral: true });
    }
});

// 5. Qabashada iyo tirtirista fariimaha spam-ka ah
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild || !message.member) return;

    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    const serverSpamWords = spamWords[message.guild.id] || [];
    if (serverSpamWords.length === 0) return;

    const contentLower = message.content.toLowerCase();
    const hasSpam = serverSpamWords.some(word => contentLower.includes(word));

    if (hasSpam) {
        try {
            await message.delete(); 
            const warning = await message.channel.send(`⚠️ ${message.author}, farriintaada waa la tirtiray sababtoo ah waxay ka kooban tahay eray mamnuuc ah!`);
            setTimeout(() => warning.delete().catch(() => null), 5000); 
        } catch (err) {
            console.error('Ma tirtiri karo farriinta:', err);
        }
    }
});

// 6. Nidaamka soo dhoweynta (Welcome)
client.on('guildMemberAdd', async member => {
    const config = welcomeConfigs[member.guild.id];
    if (!config) return;

    const welcomeChannel = member.guild.channels.cache.get(config.channelId);
    if (!welcomeChannel) return;

    let msg = config.messageText
        .replace(/{user}/g, `${member}`)
        .replace(/{server}/g, `${member.guild.name}`);

    welcomeChannel.send(msg);
});

client.login(process.env.DISCORD_TOKEN);
