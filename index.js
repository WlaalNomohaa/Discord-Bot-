const { Client, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Kaydka kumeel-gaarka ah (Database fudud oo RAM-ka ku jirta)
let welcomeConfigs = {}; 
let spamWords = []; 

// 1. Diyaarinta dhamaan amarrada (Slash Commands)
const commands = [
    new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Habee farriinta soo dhoweynta xubnaha cusub.')
        .addChannelOption(option => option.setName('channel').setDescription('Dooro channel-ka').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addStringOption(option => option.setName('text').setDescription('Qor farriinta. Isticmaal {user} iyo {server}').setRequired(true)),

    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Ku dar erayada mamnuuca ah ee la tirtirayo marka la qoro.')
        .addStringOption(option => option.setName('word').setDescription('Qor erayga ama jumlada mamnuuca ah').setRequired(true)),

    new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Xir channel-ka aad joogto si aan fariin loogu qori karin.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Foor channel xirnaa si fariin loogu qoro mar kale.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Server-ka ka saar xubin gaar ah.')
        .addUserOption(option => option.setName('user').setDescription('Dooro qofka la kick gareynayo').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Ku xir slowmode channel-ka aad joogto.')
        .addIntegerOption(option => option.setName('seconds').setDescription('Inta ilbiriqsi (seconds) oo qofku sugayo').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    new SlashCommandBuilder()
        .setName('offslowmode')
        .setDescription('Ka qaad slowmode-ka channel-ka aad joogto.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
].map(command => command.toJSON());

// 2. Markii bot-ku uu online soo galo
client.once('ready', async () => {
    console.log(`🎉 Sky 🌟 waa diyaar! ${client.user.tag}`);
    client.user.setActivity('Maamulka Server-ka', { type: ActivityType.Watching });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Bilaabaya diiwaangelinta amarrada cusub...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Dhammaan amarrada si guul leh ayaa loo galiyay! 🔥');
    } catch (error) {
        console.error(error);
    }
});

// 3. Ka jawaabista Slash Commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, channel, guild } = interaction;

    // --- /setwelcome ---
    if (commandName === 'setwelcome') {
        const targetChannel = interaction.options.getChannel('channel');
        const text = interaction.options.getString('text');
        
        welcomeConfigs[guild.id] = { channelId: targetChannel.id, messageText: text };
        await interaction.reply({ content: `✅ Si guul leh ayaa loo habeeyay soo dhoweynta! Channel: ${targetChannel}. Text: "${text}"`, ephemeral: true });
    }

    // --- /spam ---
    if (commandName === 'spam') {
        const word = interaction.options.getString('word').toLowerCase();
        if (!spamWords.includes(word)) spamWords.push(word);
        await interaction.reply({ content: `🔒 Erayga **"${word}"** waxaa lagu daray liiska spam-ka ee la mamnuucay!`, ephemeral: true });
    }

    // --- /lock ---
    if (commandName === 'lock') {
        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
            await interaction.reply({ content: '🔒 **Channel-kan waa la xiray!** Xubnaha caadiga ah fariin ma qori karaan hadda.' });
        } catch (err) {
            await interaction.reply({ content: '❌ Waxaa dhacay khalad marka la xirayay channel-ka.', ephemeral: true });
        }
    }

    // --- /unlock ---
    if (commandName === 'unlock') {
        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
            await interaction.reply({ content: '🔓 **Channel-kan waa la furay!** Qof walba fariin waa qori karaa hadda.' });
        } catch (err) {
            await interaction.reply({ content: '❌ Waxaa dhacay khalad marka la furayay channel-ka.', ephemeral: true });
        }
    }

    // --- /kick ---
    if (commandName === 'kick') {
        const targetUser = interaction.options.getUser('user');
        const member = guild.members.cache.get(targetUser.id);
        
        if (!member) return interaction.reply({ content: '❌ Qofkan lagama helin server-ka.', ephemeral: true });
        if (!member.kickable) return interaction.reply({ content: '❌ Bot-ku awood uma laha inuu kick gareeyo qofkan (Xilkiisa ayaa sarreeya).', ephemeral: true });
        
        await member.kick();
        await interaction.reply({ content: `👢 **${targetUser.tag}** si guul leh ayaa looga kick gareeyey server-ka!` });
    }

    // --- /slowmode ---
    if (commandName === 'slowmode') {
        const seconds = interaction.options.getInteger('seconds');
        await channel.setRateLimitPerUser(seconds);
        await interaction.reply({ content: `⏱️ Slowmode-ka channel-ka waxaa lagu xiray **${seconds}** ilbiriqsi.` });
    }

    // --- /offslowmode ---
    if (commandName === 'offslowmode') {
        await channel.setRateLimitPerUser(0);
        await interaction.reply({ content: '⏱️ Slowmode-ka si guul leh ayaa looga qaaday channel-ka!' });
    }
});

// 4. Qabashada fariimaha spam-ka ah ee la qorayo
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // Hubi haddii qoraalka uu ku jiro eray spam ah
    const contentLower = message.content.toLowerCase();
    const hasSpam = spamWords.some(word => contentLower.includes(word));

    if (hasSpam) {
        try {
            await message.delete(); // Tirtir farriinta spam-ka ah
            const warning = await message.channel.send(`⚠️ ${message.author}, Farriintaada waa la tirtiray sababtoo ah waxay ka kooban tahay eray mamnuuc ah (Spam)!`);
            setTimeout(() => warning.delete().catch(() => null), 5000); // Tirtir digniinta 5 ilbiriqsi kadib
        } catch (err) {
            console.error('Ma tirtiri karo farriinta:', err);
        }
    }
});

// 5. Nidaamka rasmiga ah ee soo dhoweynta (Welcome)
client.on('guildMemberAdd', async member => {
    const config = welcomeConfigs[member.guild.id];
    if (!config) return;

    const welcomeChannel = member.guild.channels.cache.get(config.channelId);
    if (!welcomeChannel) return;

    // Beddelayaasha {user} iyo {server}
    let msg = config.messageText
        .replace(/{user}/g, `${member}`)
        .replace(/{server}/g, `${member.guild.name}`);

    welcomeChannel.send(msg);
});

client.login(process.env.DISCORD_TOKEN);
