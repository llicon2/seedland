console.log("APP INICIADA")

const SUPABASE_URL = "https://lvtpsqoqywoxrvbqfycd.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dHBzcW9xeXdveHJ2YnFmeWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg1ODEsImV4cCI6MjA4ODkyNDU4MX0.AiHAyOS3zZrX3R1gPhp6GlXDOI5RO6eEF1lnLv0tnCU"

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

window.preregister = async function () {

const tg = window.Telegram.WebApp
tg.ready()

const user = tg.initDataUnsafe.user

if(!user){
document.getElementById("status").innerText =
"❌ Error cargando usuario de Telegram"
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
document.getElementById("status").innerText =
"⚠️ Ya estabas preregistrado"
}else{
document.getElementById("status").innerText =
"✅ Preregistro completado"
}

loadCount()

}

// ESTA ES LA FUNCION QUE CUENTA LOS JUGADORES
async function loadCount(){

const { count, error } = await supabase
.from("players")
.select("*", { count: "exact", head: true })

if(!error){
document.getElementById("count").innerText = count
}else{
console.log(error)
}

}

// CARGA EL CONTADOR CUANDO ABRE LA PAGINA
loadCount()