// Команда для включения/выключения технических работ
bot.command('maintenance', (ctx) => {
  const adminId = ctx.from.id; // Получаем ID пользователя
  
  if (adminId === 5339012301) {
    isUnderMaintenance = !isUnderMaintenance;
    ctx.reply(`Режим технических работ ${isUnderMaintenance ? 'включён' : 'выключен'}.`);
  } else {
    ctx.reply('У вас нет прав для выполнения этой команды.');
  }
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
    const gamesLinks = providerGames.map(game => {
      const gameNameFormatted = game.replace(/\s+/g, '-').toLowerCase();
      return `https://www.pin-up191.com/az/casino/provider/${userInput}/${gameNameFormatted}?mode=real`;
    }).join('\n');

    const message = lang === 'ru' 
      ? `Вот игры от провайдера ${userInput}! 🎮\n\n${gamesLinks}` 
      : `Bu provayderin oyunları! 🎮\n\n${gamesLinks}`;

    ctx.reply(message);
  } else {
    // Проверяем, является ли введённый текст названием игры
    const gameFound = Object.keys(providers).find(provider => 
      providers[provider].some(game => game.toLowerCase() === userInput)
    );

    if (gameFound) {
      // Находим ссылку для игры
      const gameLink = `https://www.pin-up191.com/az/casino/provider/${gameFound}/${userInput.replace(/\s+/g, '-').toLowerCase()}?mode=real`;
      const message = lang === 'ru' 
        ? `Вот твоя игра! 🎯: ${gameLink}` 
        : `Oyunun linki burada! 🎯: ${gameLink}`;
      
      ctx.reply(message);
    } else {
      // Если ни провайдера, ни игры не найдено
      const message = lang === 'ru' 
        ? 'Не удалось найти провайдера или игру. Попробуй снова с правильным названием.' 
        : 'Provayder və ya oyun tapılmadı. Yenidən düzgün adla cəhd edin.';
      ctx.reply(message);
    }
  }
});
