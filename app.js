console.log("APP INICIADA");

const SUPABASE_URL = "https://lvtpsqoqywoxrvbqfycd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dHBzcW9xeXdveHJ2YnFmeWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg1ODEsImV4cCI6MjA4ODkyNDU4MX0.AiHAyOS3zZrX3R1gPhp6GlXDOI5RO6eEF1lnLv0tnCU";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram.WebApp;

tg.ready();

document.getElementById("btn").addEventListener("click", preregister);

async function preregister() {
  const status = document.getElementById("status");
  const user = tg.initDataUnsafe?.user;

  if (!user) {
    status.innerText = "❌ Abre esta app desde Telegram";
    return;
  }

  status.innerText = "⏳ Guardando...";

  const { error } = await sb
    .from("players")
    .upsert(
      {
        telegram_id: user.id,
        name: user.first_name || "Jugador"
      },
      {
        onConflict: "telegram_id"
      }
    );

  if (error) {
    console.log("ERROR SUPABASE:", error);
    status.innerText = "❌ Error: " + error.message;
    return;
  }

  status.innerText = "✅ Preregistro completado";
  await loadCount();
}

async function loadCount() {
  const { count, error } = await sb
    .from("players")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.log("ERROR CONTADOR:", error);
    return;
  }

  document.getElementById("count").innerText = count ?? 0;
}

loadCount();