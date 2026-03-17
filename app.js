console.log("APP INICIADA");

const SUPABASE_URL = "https://lvtpsqoqywoxrvbqfycd.supabase.co";
const SUPABASE_KEY = "TU_SUPABASE_ANON_KEY";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Inicializar Telegram WebApp una vez
const tg = window.Telegram.WebApp;
tg.ready();

window.preregister = async function () {
  const statusEl = document.getElementById("status");

  try {
    const user = tg.initDataUnsafe?.user;

    if (!user) {
      statusEl.innerText = "❌ Abre esta app desde Telegram";
      return;
    }

    statusEl.innerText = "⏳ Guardando preregistro...";

    const { error } = await supabase
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
      statusEl.innerText = "❌ Error guardando jugador: " + error.message;
      return;
    }

    statusEl.innerText = "✅ Preregistro completado";
    await loadCount();

  } catch (err) {
    console.log("ERROR GENERAL:", err);
    statusEl.innerText = "❌ Error inesperado";
  }
};

// CONTADOR DE JUGADORES
async function loadCount() {
  const countEl = document.getElementById("count");

  const { count, error } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.log("ERROR CONTADOR:", error);
    countEl.innerText = "0";
    return;
  }

  countEl.innerText = count ?? 0;
}

// CARGAR CONTADOR AL ABRIR
loadCount();