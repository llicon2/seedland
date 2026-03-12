const { Telegraf } = require("telegraf")

const bot = new Telegraf("8789097060:AAGkNVDV024mQENWh4cjgeaFTNrvvyXTTnw")

bot.start((ctx) => {

ctx.reply("🌱 Bienvenido a SeedLand!", {
reply_markup:{
inline_keyboard:[
[
{
text:"🌱 Pre-registro",
web_app:{url:"https://google.com"}
}
]
]
}
})

})

bot.launch()

console.log("Bot funcionando 🚀")

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))