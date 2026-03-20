const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf("8789097060:AAGkNVDV024mQENWh4cjgeaFTNrvvyXTTnw");

bot.start((ctx) => {
bot.start((ctx) => {
  const text = ctx.message?.text || "";
  const parts = text.split(" ");
  const payload = parts.length > 1 ? parts[1].trim() : "";

  const webAppUrl = payload
    ? `https://seedland.vercel.app?ref=${payload}`
    : "https://seedland.vercel.app";

  console.log("START TEXT:", text);
  console.log("PAYLOAD:", payload);
  console.log("WEBAPP URL:", webAppUrl);

  ctx.reply(
    "🌱 Bienvenido a SeedLand\n\nConstruye tu tierra, planta semillas y gana recompensas invitando amigos.",
    Markup.inlineKeyboard([
      Markup.button.webApp("🌾 JUGAR", webAppUrl)
    ])
  );
});

bot.launch();
console.log("🤖 Bot funcionando");