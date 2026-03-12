const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf("8789097060:AAGkNVDV024mQENWh4cjgeaFTNrvvyXTTnw");

bot.start((ctx) => {
  ctx.reply(
    "🌱 Bienvenido a Seedland\n\nConstruye tu tierra, planta semillas y gana recompensas.",
    Markup.inlineKeyboard([
      Markup.button.webApp("🌾 JUGAR", "https://seedland.vercel.app")
    ])
  );
});

bot.launch();
console.log("Bot funcionando");