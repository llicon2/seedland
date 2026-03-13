console.log("APP INICIADA")
console.log(window.Telegram)

const SUPABASE_URL = "https://lvtpsqoqywoxrvbqfycd.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dHBzcW9xeXdveHJ2YnFmeWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg1ODEsImV4cCI6MjA4ODkyNDU4MX0.AiHAyOS3zZrX3R1gPhp6GlXDOI5RO6eEF1lnLv0tnCU"

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

window.preregister = async function(){

const tg = window.Telegram.WebApp
const user = tg.initDataUnsafe.user

if(!user){
document.getElementById("status").innerText = "❌ Error cargando usuario de Telegram"
return
}

const { error } = await supabase
.from("players")
.insert([
{
telegram_id: user.id
}
])

if(error){
document.getElementById("status").innerText = "⚠️ Ya estabas preregistrado."
}else{
document.getElementById("status").innerText = "✅ Ya estás preregistrado!"
loadCount()
}

}

async function loadCount(){

const { data } = await supabase
.from("players")
.select("*")

if(data){
document.getElementById("count").innerText = data.length
}

}

loadCount()