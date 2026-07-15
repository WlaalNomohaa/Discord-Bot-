const { Client: DiscordClient, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { Pool } = require('pg');

// 1. ISKU-XIRKA POSTGRESQL (RAILWAY)
const connectionString = 'postgresql://postgres:WJqJPWSoEkhvNpLgkTITbtNRuVxnMWce@interchange.proxy.rlwy.net:59942/railway';

const pgClient = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pgClient.on('error', (err) => {
    console.error('⚠️ Khalad lama filaan ah oo ka yimid Postgres Pool (waa la maareeyay, bot-ku sii socon doonaa):', err.message);
});

pgClient.connect()
    .then((c) => {
        c.release();
        console.log('🎯 Si guul leh ayuu bot-ku ugu xirmay Postgres Database (Railway)!');
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
            CREATE TABLE IF NOT EXISTS antilinks (
                guild_id TEXT PRIMARY KEY,
                enabled BOOLEAN DEFAULT true
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

// Regex lagu ogaanayo links-ka
const LINK_REGEX = /(https?:\/\/|www\.|discord\.gg\/|discord\.com\/invite\/)\S+/i;

// ====== MIDABADA EMBED-KA (BRAND COLORS) ======
const COLORS = {
    success: 0x57F287,
    error:   0xED4245,
    warning: 0xFEE75C,
    info:    0x5865F2,
    brand:   0x8E5CFF
};
const FOOTER = { text: 'Sky 🌟 | Server Management', };

// Helper: samee embed si degdeg ah
const makeEmbed = ({ color = COLORS.brand, title, description, fields, thumbnail } = {}) => {
    const embed = new EmbedBuilder().setColor(color).setFooter(FOOTER).setTimestamp();
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (fields) embed.addFields(fields);
    if (thumbnail) embed.setThumbnail(thumbnail);
    return embed;
};

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
        .setDescription('Ku dar erayada mamnuuca ah. Waad kala qori kartaa dhowr eray adoo u dhaxaysiinaya space.')
        .addStringOption(option => option.setName('word').setDescription('Qor erayada (Tusaale: hw hw siiil)').setRequired(true)),

    new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Xir channel-ka oo dhan gabi ahaanba (Admins Only).'),

    new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Fur channel-ka si fariin loogu qoro mar kale (Admins Only).'),

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
        .setDescription('Ka qaad slowmode-ka channel-ka aad joogto (Admins Only).'),

    new SlashCommandBuilder()
        .setName('antilinks')
        .setDescription('Shaqaali/Jooji ilaalinta Links-ka server-ka (Admins Only).')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Dooro on ama off')
                .setRequired(true)
                .addChoices(
                    { name: 'on', value: 'on' },
                    { name: 'off', value: 'off' }
                )
        )
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

const getUnmuteRow = (userId) => {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`unmute_${userId}`)
                .setLabel('Unmute')
                .setEmoji('🔓')
                .setStyle(ButtonStyle.Success)
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

        const embed = makeEmbed({
            color: COLORS.brand,
            title: `Hi ${owner.user.username} 👋`,
            description: `Mahadsanid inaad **Sky 🌟** ku darto server-kaaga **${guild.name}**!\n\nGuji buttons-ka hoose si aad u aragto amarrada ama u hesho support.`
        }).setThumbnail(client.user.displayAvatarURL());

        await owner.send({
            embeds: [embed],
            components: [getButtonsRow()]
        });
    } catch (err) {
        console.error('Wuu xirnaa DM-ka Owner-ka:', err);
    }
});

// 5. Ka jawaabista Slash Commands & Buttons
client.on('interactionCreate', async interaction => {

    // --- BUTTON: Unmute ---
    if (interaction.isButton()) {
        if (!interaction.customId.startsWith('unmute_')) return;

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ **Ma haysatid oggolaansho!** Kaliya Maamulayaasha ayaa isticmaali kara button-kan.' })],
                ephemeral: true
            });
        }

        const targetId = interaction.customId.replace('unmute_', '');
        try {
            const targetMember = await interaction.guild.members.fetch(targetId);
            await targetMember.timeout(null, 'Unmute laga sameeyay admin');
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.success, title: '🔓 Unmute', description: `**${targetMember.user.tag}** waa laga qaaday mute-ka!` })],
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ Khalad ayaa dhacay marka qofka la unmute gareynayay (waxa laga yaabaa inuu maqan yahay server-ka).' })],
                ephemeral: true
            });
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;
    const { commandName, channel, guild, member, user } = interaction;

    // --- /help ---
    if (commandName === 'help') {
        const helpEmbed = makeEmbed({
            color: COLORS.brand,
            title: `👋 Hi ${user.username}, I'm Sky Bot`,
            description: 'Waa kuwan amarrada aad isticmaali karto:',
            fields: [
                { name: '📢 /setwelcome', value: 'Samey Welcome Message', inline: true },
                { name: '🧹 /clean', value: 'Ka tirtir farriimaha (1-100)', inline: true },
                { name: '👢 /kick', value: 'User Kick Gareey', inline: true },
                { name: '🔒 /lock', value: 'Xir Channel-ka', inline: true },
                { name: '🔓 /unlock', value: 'Fur Channel-ka', inline: true },
                { name: '⏱️ /slowmode', value: 'Saar daqiiqado Channel-ka', inline: true },
                { name: '⏱️ /offslowmode', value: 'Ka qaad daqiiqadaha', inline: true },
                { name: '🚫 /spam', value: 'Xir Hadalada Xun Xun', inline: true },
                { name: '🔗 /antilinks', value: 'Shaqaali/Jooji ilaalinta Links-ka', inline: true }
            ]
        }).setThumbnail(client.user.displayAvatarURL())
          .setDescription('Waqti dhow saaxiib! Waad ku mahadsantahay doorashada aad i dooratay 🔥');

        try {
            await user.send({ embeds: [helpEmbed], components: [getButtonsRow()] });
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.success, description: '✅ Macluumaadka bot-ka waxaa lagugu soo diray DM-kaaga!' })],
                ephemeral: true
            });
        } catch (err) {
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ Aad baan uga xumahay, ma kuu soo diri karo DM. Fadlan fur DM-kaaga.' })],
                ephemeral: true
            });
        }
        return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            embeds: [makeEmbed({ color: COLORS.error, description: '❌ **Ma haysatid oggolaansho!** Kaliya Maamulayaasha (**Administrator**) ayaa isticmaali kara amarradan.' })],
            ephemeral: true
        });
    }

    // --- /clean ---
    if (commandName === 'clean') {
        const amount = interaction.options.getInteger('amount');
        if (amount < 1 || amount > 100) {
            return interaction.reply({
                embeds: [makeEmbed({ color: COLORS.warning, description: '⚠️ Fadlan dooro tiro u dhaxeysa 1 ilaa 100 farriimood.' })],
                ephemeral: true
            });
        }

        try {
            const deleted = await channel.bulkDelete(amount, true);
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.success, title: '🧹 Clean', description: `Si guul leh ayaa channel-ka looga tirtiray **${deleted.size}** farriimood!` })],
                ephemeral: true
            });
        } catch (err) {
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ Waxaa dhacay khalad marka farriimaha la tirtirayay.' })],
                ephemeral: true
            });
        }
    }

    // --- /setwelcome ---
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

            await interaction.reply({
                embeds: [makeEmbed({
                    color: COLORS.success,
                    title: '✅ Welcome Message',
                    description: `Si guul leh ayaa loo kaydiyey soo dhoweynta!`,
                    fields: [
                        { name: 'Channel', value: `${targetChannel}`, inline: true },
                        { name: 'Farriinta', value: text }
                    ]
                })],
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ Khalad ayaa dhacay marka xogta la kaydinayay.' })],
                ephemeral: true
            });
        }
    }

    // --- /spam ---
    if (commandName === 'spam') {
        const inputString = interaction.options.getString('word').toLowerCase().trim();
        const inputWords = inputString.split(/\s+/).filter(Boolean);

        if (inputWords.length === 0) {
            return interaction.reply({
                embeds: [makeEmbed({ color: COLORS.warning, description: '⚠️ Fadlan qor erayada aad rabto inaad mamnuucdo.' })],
                ephemeral: true
            });
        }

        try {
            const res = await pgClient.query('SELECT words FROM spam WHERE guild_id = $1', [guild.id]);

            let currentWords = [];
            if (res.rows.length > 0 && res.rows[0].words) {
                currentWords = res.rows[0].words;
            }

            let newWordsAdded = [];

            for (const word of inputWords) {
                if (!currentWords.includes(word)) {
                    currentWords.push(word);
                    newWordsAdded.push(word);
                }
            }

            if (newWordsAdded.length > 0) {
                if (res.rows.length === 0) {
                    await pgClient.query('INSERT INTO spam (guild_id, words) VALUES ($1, $2)', [guild.id, currentWords]);
                } else {
                    await pgClient.query('UPDATE spam SET words = $2 WHERE guild_id = $1', [guild.id, currentWords]);
                }

                await interaction.reply({
                    embeds: [makeEmbed({
                        color: COLORS.success,
                        title: '🔒 Spam Words',
                        description: `Eraydan soo socda mid mid ayaa loo kala mamnuucay, laguna kaydiyey Postgres:\n${newWordsAdded.map(w => `• **${w}**`).join('\n')}`
                    })],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    embeds: [makeEmbed({ color: COLORS.info, description: 'ℹ️ Dhamaan erayada aad qortay horey ayay ugu jireen liiska erayada mamnuuca ah.' })],
                    ephemeral: true
                });
            }

        } catch (err) {
            console.error(err);
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ Khalad ayaa dhacay marka xogta la kala jabiyey ee la kaydinayay.' })],
                ephemeral: true
            });
        }
    }

    // --- /lock ---
    if (commandName === 'lock') {
        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, {
                SendMessages: false,
                CreatePublicThreads: false,
                CreatePrivateThreads: false,
                SendMessagesInThreads: false
            });
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.warning, title: '🔒 Locked', description: '**Channel-kan waa la xiray gabi ahaanba!** Xubnuhu kaliya way daawan karaan (View Only).' })],
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ Waxaa dhacay khalad marka channel-ka la xirayay.' })],
                ephemeral: true
            });
        }
    }

    // --- /unlock ---
    if (commandName === 'unlock') {
        try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, {
                SendMessages: null,
                CreatePublicThreads: null,
                CreatePrivateThreads: null,
                SendMessagesInThreads: null
            });
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.success, title: '🔓 Unlocked', description: '**Channel-kan waa la furay!** Xubnuhu caadi ahaan ayay wax u qori karaan.' })],
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ Waxaa dhacay khalad marka channel-ka la furayay.' })],
                ephemeral: true
            });
        }
    }

    // --- /kick ---
    if (commandName === 'kick') {
        const targetUser = interaction.options.getUser('user');
        const targetMember = guild.members.cache.get(targetUser.id);
        if (!targetMember || !targetMember.kickable) {
            return interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ Qofkan ma kick gareyn karo.' })],
                ephemeral: true
            });
        }

        await targetMember.kick();
        await interaction.reply({
            embeds: [makeEmbed({ color: COLORS.success, title: '👢 Kicked', description: `**${targetUser.tag}** si guul leh ayaa looga kick gareeyey!` })],
            ephemeral: true
        });
    }

    // --- /slowmode ---
    if (commandName === 'slowmode') {
        const seconds = interaction.options.getInteger('seconds');
        await channel.setRateLimitPerUser(seconds);
        await interaction.reply({
            embeds: [makeEmbed({ color: COLORS.info, title: '⏱️ Slowmode', description: `Slowmode-ka waxaa lagu xiray **${seconds}** ilbiriqsi.` })],
            ephemeral: true
        });
    }

    // --- /offslowmode ---
    if (commandName === 'offslowmode') {
        await channel.setRateLimitPerUser(0);
        await interaction.reply({
            embeds: [makeEmbed({ color: COLORS.info, title: '⏱️ Slowmode', description: 'Slowmode-ka si guul leh ayaa looga qaaday!' })],
            ephemeral: true
        });
    }

    // --- /antilinks ---
    if (commandName === 'antilinks') {
        const status = interaction.options.getString('status');
        const enabled = status === 'on';

        try {
            await pgClient.query(`
                INSERT INTO antilinks (guild_id, enabled)
                VALUES ($1, $2)
                ON CONFLICT (guild_id)
                DO UPDATE SET enabled = $2;
            `, [guild.id, enabled]);

            await interaction.reply({
                embeds: [makeEmbed({
                    color: enabled ? COLORS.success : COLORS.warning,
                    title: '🔗 Antilinks',
                    description: enabled
                        ? '✅ **Antilinks waa la shaqaaliyay!** Hadda cidkasta oo link dhiga (xubno aan admin ahayn) waa la mute gareynayaa.'
                        : '🛑 **Antilinks waa la joojiyay.**'
                })],
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            await interaction.reply({
                embeds: [makeEmbed({ color: COLORS.error, description: '❌ Khalad ayaa dhacay marka antilinks la habaynayay.' })],
                ephemeral: true
            });
        }
    }
});

// 6. Qabashada fariimaha (Spam, Antilinks & DM Auto-Responder)
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
            const dmEmbed = makeEmbed({
                color: COLORS.brand,
                title: `Hi ${message.author.username} 👋`,
                description: `Use **/** commands I'm Working! or Add Your Server 🔍`
            }).setThumbnail(client.user.displayAvatarURL());

            await message.author.send({ embeds: [dmEmbed], components: [dmRow] });
        } catch (err) {
            console.error(err);
        }
        return;
    }

    // --- QAYBTA SERVER-KA (Admin waa laga reebay labadaba) ---
    if (!message.guild || !message.member) return;
    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    // --- ANTILINKS ---
    try {
        const alRes = await pgClient.query('SELECT enabled FROM antilinks WHERE guild_id = $1', [message.guild.id]);
        const antilinksEnabled = alRes.rows.length > 0 && alRes.rows[0].enabled;

        if (antilinksEnabled && LINK_REGEX.test(message.content)) {
            await message.delete().catch(() => null);

            if (message.member.moderatable) {
                await message.member.timeout(10 * 60 * 1000, 'Link dhigay oo aan la ogolayn').catch(() => null);
            }

            const warnEmbed = makeEmbed({
                color: COLORS.warning,
                title: '⚠️ Link La Ogola Maahan',
                description: `${message.author} Fadlan Kama OgoLa Links Badan ⚠️\n\nWaxaa lagaa saaray hadal 10 daqiiqo ah.`
            }).setThumbnail(message.author.displayAvatarURL());

            await message.channel.send({
                embeds: [warnEmbed],
                components: [getUnmuteRow(message.author.id)]
            });
            return;
        }
    } catch (err) {
        console.error(err);
    }

    // --- QAYBTA SERVER SPAM-KA ---
    try {
        const res = await pgClient.query('SELECT words FROM spam WHERE guild_id = $1', [message.guild.id]);
        if (res.rows.length === 0) return;

        const words = res.rows[0].words || [];
        if (words.length === 0) return;

        const contentLower = message.content.toLowerCase();
        const hasSpam = words.some(word => contentLower.includes(word));

        if (hasSpam) {
            await message.delete();
            const spamEmbed = makeEmbed({
                color: COLORS.warning,
                description: `⚠️ ${message.author}, farriintaada waa la tirtiray sababtoo ah waxay ka kooban tahay eray mamnuuc ah!`
            });
            const warning = await message.channel.send({ embeds: [spamEmbed] });
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

        const welcomeEmbed = makeEmbed({
            color: COLORS.brand,
            title: `🎉 Welcome to ${member.guild.name}!`,
            description: msg
        }).setThumbnail(member.user.displayAvatarURL());

        welcomeChannel.send({ embeds: [welcomeEmbed] });
    } catch (err) {
        console.error(err);
    }
});

// 8. Ilaalinta process-ka
process.on('unhandledRejection', (err) => {
    console.error('⚠️ Unhandled Rejection (waa la maareeyay):', err);
});
process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception (waa la maareeyay):', err);
});

client.login(process.env.DISCORD_TOKEN);
