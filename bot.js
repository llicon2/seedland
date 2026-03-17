const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf("8789097060:AAGkNVDV024mQENWh4cjgeaFTNrvvyXTTnw");

bot.start((ctx) => {
  const payload = ctx.startPayload || "";
  const webAppUrl = payload
    ? `https://seedland.vercel.app?ref=${payload}`
    : "https://seedland.vercel.app";

  ctx.reply(
    "🌱 Bienvenido a SeedLand\n\nConstruye tu tierra, planta semillas y gana recompensas invitando amigos.",
    Markup.inlineKeyboard([
      Markup.button.webApp("🌾 JUGAR", webAppUrl)
    ])
  );
});

bot.launch();
console.log("🤖 Bot funcionando");