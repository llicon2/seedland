const { Telegraf, Markup } = require("telegraf");

// RECOMENDADO: usar variable de entorno
// const bot = new Telegraf(process.env.BOT_TOKEN);

// TEMPORAL: si todavía no usas .env, deja tu token aquí
const bot = new Telegraf("8789097060:AAGkNVDV024mQENWh4cjgeaFTNrvvyXTTnw");

const BASE_WEBAPP_URL = "https://seedland.vercel.app";
const CHANNEL_URL = "https://t.me/seedland_news";

bot.start(async (ctx) => {
  try {
    const text = ctx.message?.text || "";
    const parts = text.split(" ");
    const payload = parts.length > 1 ? parts[1].trim() : "";

    const webAppUrl = payload
      ? `${BASE_WEBAPP_URL}?ref=${encodeURIComponent(payload)}`
      : BASE_WEBAPP_URL;

    console.log("START TEXT:", text);
    console.log("PAYLOAD:", payload);
    console.log("WEBAPP URL:", webAppUrl);

    const message =
`🌱 *Bienvenido a SeedLand*

Construye tu tierra, planta semillas y genera recompensas.

🧑‍🌾 Compra parcelas
🌱 Planta semillas
🪙 Genera producción
🐦 Espanta cuervos y protege tu granja

🎁 Pre-regístrate para recibir ventajas en el lanzamiento.`;

    await ctx.reply(
      message,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.webApp("🎮 Jugar SeedLand", webAppUrl)],
          [Markup.button.url("📢 Canal oficial", CHANNEL_URL)]
        ])
      }
    );
  } catch (error) {
    console.error("ERROR EN /start:", error);
  }
});

bot.launch();
console.log("🤖 Bot funcionando");

// cierre limpio
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));