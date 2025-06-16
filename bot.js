const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const gamesData = require('./games.json');

const bot = new Telegraf('7928615793:AAE3IktbE-rYlUEXTcV_yTKwfeXAQ_zV-no');

// İstifadəçi faylı
const USERS_FILE = './users.json';

function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    return JSON.parse(fs.readFileSync(USERS_FILE));
  }
  return [];
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

let userIds = loadUsers();

function registerUser(id) {
  if (!userIds.includes(id)) {
    userIds.push(id);
    saveUsers(userIds);
  }
}

const userLanguages = {};
let isUnderMaintenance = false;

const YOUR_ADMIN_ID = 5339012301;

// Qlobal texniki işlər komandası
bot.command('maintenance', (ctx) => {
  const adminId = ctx.from.id;
  if (adminId === YOUR_ADMIN_ID) {
    isUnderMaintenance = !isUnderMaintenance;
    ctx.reply(`Режим технических работ ${isUnderMaintenance ? 'включён' : 'выключен'}.`);
  } else {
    ctx.reply('У вас нет прав для выполнения этой команды.');
  }
});

// Broadcast komandası (admin üçün)
bot.command('broadcast', async (ctx) => {
  if (ctx.from.id !== YOUR_ADMIN_ID) {
    return ctx.reply('У вас нет прав для этой команды.');
  }

  const messageParts = ctx.message.text.split(' ').slice(1);
  const message = messageParts.join(' ');

  if (!message) {
    return ctx.reply('❗ Напишите сообщение после команды. Пример:\n/broadcast Новые игры добавлены!');
  }

  let success = 0;
  let failed = 0;

  for (const id of userIds) {
    try {
      await ctx.telegram.sendMessage(id, message);
      success++;
    } catch (err) {
      failed++;
    }
  }

  ctx.reply(`📢 Рассылка завершена:\n✅ Успешно: ${success}\n❌ Ошибки: ${failed}`);
});

// Dil seçimi /start
bot.start((ctx) => {
  registerUser(ctx.chat.id);
  ctx.reply('Привет! Я бот, который помогает найти игры.\n\nВыберите язык:', Markup.inlineKeyboard([
    Markup.button.callback('Русский', 'set_lang_ru'),
    Markup.button.callback('Azərbaycan', 'set_lang_az')
  ]));
});

// Dil seçimləri
bot.action('set_lang_ru', (ctx) => {
  userLanguages[ctx.chat.id] = 'ru';
  ctx.reply('Ну что, русский язык выбран! Напиши название провайдера или слот, и я расскажу, где её найти.');
});

bot.action('set_lang_az', (ctx) => {
  userLanguages[ctx.chat.id] = 'az';
  ctx.reply('Azərbaycan dili seçildi! Provayder və ya oyunun adını yaz, və mən sənə onu taparam!');
});

// Texniki işlərə görə bloklama
bot.use((ctx, next) => {
  if (ctx.chat && ctx.chat.id) {
    registerUser(ctx.chat.id);
  }

  if (isUnderMaintenance) {
    ctx.reply('⚙️ Bот временно недоступен из-за технических работ. Попробуйте позже.');
    return;
  }

  return next();
});

// Axtarış mesajları
bot.on('text', (ctx) => {
  const lang = userLanguages[ctx.chat.id];
  if (!lang) {
    ctx.reply('Пожалуйста, выберите язык сначала.');
    return;
  }

  const providers = gamesData[lang]?.providers;
  if (!providers) {
    ctx.reply('Не удалось найти провайдеров для выбранного языка.');
    return;
  }

  const userInput = ctx.message.text.trim().toLowerCase();
  console.log(`Поиск для: ${userInput}`);

  const providerGames = providers[userInput];
  if (providerGames) {
    const gamesLinks = providerGames.map(game => {
      const gameNameFormatted = game.replace(/\s+/g, '-').toLowerCase();
      return `https://www.pin-up191.com/az/casino/provider/${userInput}/${gameNameFormatted}?mode=real`;
    }).join('\n');

    const message = lang === 'ru' 
      ? `Вот игры от провайдера ${userInput}! 🎮\n\n${gamesLinks}` 
      : `Bu provayderin oyunları! 🎮\n\n${gamesLinks}`;

    ctx.reply(message);
  } else {
    const gameFound = Object.keys(providers).find(provider => 
      providers[provider].some(game => game.toLowerCase() === userInput)
    );

    if (gameFound) {
      const gameLink = `https://www.pin-up191.com/az/casino/provider/${gameFound}/${userInput.replace(/\s+/g, '-').toLowerCase()}?mode=real`;
      const message = lang === 'ru' 
        ? `Вот твоя игра! 🎯: ${gameLink}` 
        : `Oyunun linki burada! 🎯: ${gameLink}`;

      ctx.reply(message);
    } else {
      const message = lang === 'ru' 
        ? 'Не удалось найти провайдера или игру. Попробуй снова с правильным названием.' 
        : 'Provayder və ya oyun tapılmadı. Yenidən düzgün adla cəhd edin.';
      ctx.reply(message);
    }
  }
});

// Webhook-u sil və polling-i başlat
(async () => {
  try {
    await bot.telegram.deleteWebhook();
    await bot.launch();
    console.log('Бот запущен через polling');
  } catch (error) {
    console.error('Ошибка запуска бота:', error);
  }
})();
