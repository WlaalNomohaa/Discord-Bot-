const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

// Abuurista bot-ka iyo u oggolaanshaha inuu akhriyo fariimaha iyo xubnaha
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Markii bot-ku uu online soo galo
client.once('ready', () => {
    console.log(`🎉 Sky 🌟 waa diyaar! Waxaa lagu soo galay magaca: ${client.user.tag}`);
    
    // Waxaad u samayn kartaa status yar (sida: Playing / Watching)
    client.user.setActivity('Server-ka Sky', { type: ActivityType.Watching });
});

// Markii uu qof cusub soo galo Server-ka (Welcome)
client.on('guildMemberAdd', (member) => {
    // Wuxû ka raadinayaa server-ka channel magaciisu yahay "welcome"
    const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
    if (!channel) return;
    
    channel.send(`Ku soo dhowoow Server-ka, ${member}! 🎉 Sky ayaa ku soo dhoweynaysa.`);
});

// Ka jawaabista fariimaha iyo amarrada (Commands)
client.on('messageCreate', (message) => {
    // Haddii fariinta uu bot qoray, iska indho-tir
    if (message.author.bot) return;

    // Haddii qof uu qoro "!caawinaad"
    if (message.content === '!caawinaad') {
        message.reply('Haye! Waxaan ahay Sky 🌟, caawiyahaaga rasmiga ah. Isticmaal amarradan:\n`!xeerarka` - Si aad u aragto xeerarka.\n`!info` - Warbixinta server-ka.');
    }

    // Haddii qof uu qoro "!xeerarka"
    if (message.content === '!xeerarka') {
        message.reply('**Xeerarka Server-ka:**\n1. Ixtiraam xubnaha kale.\n2. Ha samayn spam ama xayeysiis aan laguu oggolaan.\n3. Ku hadal hadal wanaagsan.');
    }
});

// Kinesis wuxuu si otomaatig ah token-ka uga akhrisanayaa Environment Variables
client.login(process.env.DISCORD_TOKEN);
