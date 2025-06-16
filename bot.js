const { Telegraf, Markup } = require('telegraf');
const gamesData = require('./games.json');

const bot = new Telegraf('7928615793:AAE3IktbE-rYlUEXTcV_yTKwfeXAQ_zV-no');

const userLanguages = {};
let isUnderMaintenance = false;

const YOUR_ADMIN_ID = 5339012301;

// Команда для включения/выключения тех.работ
bot.command('maintenance', (ctx) => {
  const adminId = ctx.from.id;
  if (adminId === YOUR_ADMIN_ID) {
    isUnderMaintenance = !isUnderMaintenance;
    ctx.reply(`Режим технических работ ${isUnderMaintenance ? 'включён' : 'выключен'}.`);
  } else {
    ctx.reply('У вас нет прав для выполнения этой команды.');
  }
});

// Команда /start — выбор языка
bot.start((ctx) => {
  ctx.reply('Привет! Я бот, который помогает найти игры.\n\nВыберите язык:', Markup.inlineKeyboard([
    Markup.button.callback('Русский', 'set_lang_ru'),
    Markup.button.callback('Azərbaycan', 'set_lang_az')
  ]));
});

// Обработка выбора языка
bot.action('set_lang_ru', (ctx) => {
  userLanguages[ctx.chat.id] = 'ru';
  ctx.reply('Ну что, русский язык выбран! Напиши название провайдера или слот, и я расскажу, где её найти.');
});

bot.action('set_lang_az', (ctx) => {
  userLanguages[ctx.chat.id] = 'az';
  ctx.reply('Azərbaycan dili seçildi! Provayder və ya oyunun adını yaz, və mən sənə onu taparam!');
});

// Проверка на тех.работы
bot.use((ctx, next) => {
  if (isUnderMaintenance) {
    ctx.reply('⚙️ Бот временно недоступен из-за технических работ. Попробуйте позже.');
    return;
  }
  return next();
});

// Обработка текстовых сообщений
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

// Удаляем webhook и запускаем бота
// Удаляем webhook и запускаем бота
(async () => {
  try {
    await bot.telegram.deleteWebhook(); // отключаем webhook
    await bot.launch(); // запускаем бот через polling
    console.log('Бот запущен через polling');
  } catch (error) {
    console.error('Ошибка запуска бота:', error);
  }
})();

