const { Telegraf, Markup } = require('telegraf'); // Импортируем библиотеку Telegraf
const gamesData = require('./games.json'); // Подключаем JSON с играми

const bot = new Telegraf('7928615793:AAE3IktbE-rYlUEXTcV_yTKwfeXAQ_zV-no'); // Замените на токен вашего бота

// Храним выбранный язык пользователя
const userLanguages = {};
let isUnderMaintenance = false; // Переменная для режима технических работ
const YOUR_ADMIN_ID = 5339012301; // Укажите ваш Telegram ID

// Команда /start с кнопками для выбора языка
bot.start((ctx) => {
  ctx.reply(
    'Привет! Я бот, который помогает найти игры.\n\nВыберите язык:',
    Markup.inlineKeyboard([
      Markup.button.callback('Русский', 'set_lang_ru'),
      Markup.button.callback('Azərbaycan', 'set_lang_az'),
    ])
  );
});

// Обработка выбора языка
bot.action('set_lang_ru', (ctx) => {
  userLanguages[ctx.chat.id] = 'ru';
  ctx.reply('Ну что, русский язык выбран! Напиши название провайдера или слот, и я расскажу, где её найти. 🔍💥:');
});

bot.action('set_lang_az', (ctx) => {
  userLanguages[ctx.chat.id] = 'az';
  ctx.reply('Azərbaycan dili seçildi! Provayder və ya oyunun adını yaz, və mən sənə onu taparam! 🎮🔥:');
});

// Команда для включения/выключения технических работ
bot.command('maintenance', (ctx) => {
  const adminId = ctx.from.id; // Получаем ID пользователя

  if (adminId === YOUR_ADMIN_ID) {
    isUnderMaintenance = !isUnderMaintenance;
    ctx.reply(`Режим технических работ ${isUnderMaintenance ? 'включён' : 'выключен'}.`);

    // Уведомление о техработах
    if (isUnderMaintenance) {
      ctx.reply('⚙️ Все пользователи будут уведомлены, что бот временно недоступен.');
    }
  } else {
    ctx.reply('У вас нет прав для выполнения этой команды.');
  }
});

// Команда для проверки статуса технических работ
bot.command('status', (ctx) => {
  const message = isUnderMaintenance
    ? '⚙️ Сейчас активен режим технических работ.'
    : '✅ Бот работает нормально.';
  ctx.reply(message);
});

// Проверка перед выполнением всех сообщений
bot.use((ctx, next) => {
  if (isUnderMaintenance) {
    ctx.reply('⚙️ Бот временно недоступен из-за технических работ. Попробуйте позже.');
    return;
  }
  return next();
});

// Обработка текста (ввод названия провайдера или игры)
bot.on('text', (ctx) => {
  const lang = userLanguages[ctx.chat.id]; // Получаем выбранный язык пользователя
  if (!lang) {
    ctx.reply('Пожалуйста, выберите язык сначала.');
    return;
  }

  const providers = gamesData[lang]?.providers; // Получаем список провайдеров
  if (!providers) {
    ctx.reply('Не удалось найти провайдеров для выбранного языка.');
    return;
  }

  const userInput = ctx.message.text.trim().toLowerCase(); // Получаем введённый текст и преобразуем к нижнему регистру
  console.log(`Поиск для: ${userInput}`); // Отладочная информация

  // Проверяем, является ли введённый текст названием провайдера
  const providerGames = providers[userInput];
  if (providerGames) {
    // Формируем сообщение с играми провайдера
    const gamesLinks = providerGames
      .map((game) => {
        const gameNameFormatted = game.replace(/\s+/g, '-').toLowerCase();
        return `https://www.pin-up191.com/az/casino/provider/${userInput}/${gameNameFormatted}?mode=real`;
      })
      .join('\n');

    const message =
      lang === 'ru'
        ? `Вот игры от провайдера ${userInput}! 🎮\n\n${gamesLinks}`
        : `Bu provayderin oyunları! 🎮\n\n${gamesLinks}`;

    ctx.reply(message);
  } else {
    // Проверяем, является ли введённый текст названием игры
    const gameFound = Object.keys(providers).find((provider) =>
      providers[provider].some((game) => game.toLowerCase() === userInput)
    );

    if (gameFound) {
      // Находим ссылку для игры
      const gameLink = `https://www.pin-up191.com/az/casino/provider/${gameFound}/${userInput
        .replace(/\s+/g, '-')
        .toLowerCase()}?mode=real`;
      const message =
        lang === 'ru'
          ? `Вот твоя игра! 🎯: ${gameLink}`
          : `Oyunun linki burada! 🎯: ${gameLink}`;

      ctx.reply(message);
    } else {
      // Если ни провайдера, ни игры не найдено
      const message =
        lang === 'ru'
          ? 'Не удалось найти провайдера или игру. Попробуй снова с правильным названием.'
          : 'Provayder və ya oyun tapılmadı. Yenidən düzgün adla cəhd edin.';
      ctx.reply(message);
    }
  }
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`Произошла ошибка: ${err}`);
  ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
});

// Запуск бота
bot.launch();

console.log('Бот запущен!');
