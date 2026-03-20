console.log("GAME INICIADO");

const SUPABASE_URL = "https://lvtpsqoqywoxrvbqfycd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dHBzcW9xeXdveHJ2YnFmeWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg1ODEsImV4cCI6MjA4ODkyNDU4MX0.AiHAyOS3zZrX3R1gPhp6GlXDOI5RO6eEF1lnLv0tnCU";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram.WebApp;

tg.ready();

const welcomeText = document.getElementById("welcomeText");
const buyPlotBtn = document.getElementById("buyPlotBtn");
const buySeedBtn = document.getElementById("buySeedBtn");
const plotStatus = document.getElementById("plotStatus");
const plotVisual = document.getElementById("plotVisual");
const seedVisual = document.getElementById("seedVisual");

let currentPlayerId = null;
let currentPlayerName = "Jugador";

buyPlotBtn.addEventListener("click", buyPlot);

function getTelegramUser() {
  return tg.initDataUnsafe?.user || null;
}

async function loadPlayer() {
  const user = getTelegramUser();

  if (!user) {
    welcomeText.innerText = "❌ Abre esta app desde Telegram";
    buyPlotBtn.disabled = true;
    buySeedBtn.disabled = true;
    return false;
  }

  currentPlayerId = Number(user.id);
  currentPlayerName = user.first_name || "Jugador";

  welcomeText.innerText = `Bienvenido, ${currentPlayerName}`;

  const { data, error } = await sb
    .from("players")
    .select("telegram_id, name")
    .eq("telegram_id", currentPlayerId)
    .maybeSingle();

  if (error) {
    console.log("ERROR CARGANDO PLAYER:", error);
    welcomeText.innerText = "❌ Error cargando jugador";
    buyPlotBtn.disabled = true;
    buySeedBtn.disabled = true;
    return false;
  }

  if (!data) {
    welcomeText.innerText = "❌ Primero debes preregistrarte";
    buyPlotBtn.disabled = true;
    buySeedBtn.disabled = true;
    plotStatus.innerText = "Vuelve al preregistro antes de jugar.";
    return false;
  }

  return true;
}

async function loadPlot() {
  if (!currentPlayerId) return;

  const { data, error } = await sb
    .from("plots")
    .select("id, status, created_at")
    .eq("player_id", currentPlayerId)
    .maybeSingle();

  if (error) {
    console.log("ERROR CARGANDO PARCELA:", error);
    plotStatus.innerText = "❌ Error cargando parcela";
    return;
  }

  if (!data) {
    renderNoPlot();
    return;
  }

  renderOwnedPlot();
}

function renderNoPlot() {
  plotVisual.innerText = "🟫";
  seedVisual.innerText = "🌰";

  plotStatus.innerText = "Compra tu primera parcela";

  buyPlotBtn.disabled = false;
  buyPlotBtn.innerText = "Comprar parcela";

  buySeedBtn.disabled = true;
  buySeedBtn.innerText = "Comprar semilla";
}

function renderOwnedPlot() {
  plotVisual.innerText = "🌾";
  seedVisual.innerText = "🌱";

  plotStatus.innerText = "✅ Parcela lista para plantar";

  buyPlotBtn.innerText = "✅ Parcela comprada";
  buyPlotBtn.disabled = true;

  buySeedBtn.disabled = false;
  buySeedBtn.innerText = "Comprar semilla";
}

async function buyPlot() {
  if (!currentPlayerId) return;

  plotStatus.innerText = "⏳ Comprando parcela...";
  buyPlotBtn.disabled = true;

  const { data: existingPlot, error: checkError } = await sb
    .from("plots")
    .select("id")
    .eq("player_id", currentPlayerId)
    .maybeSingle();

  if (checkError) {
    console.log("ERROR REVISANDO PARCELA:", checkError);
    plotStatus.innerText = "❌ " + checkError.message;
    buyPlotBtn.disabled = false;
    return;
  }

  if (existingPlot) {
    plotStatus.innerText = "✅ Ya tienes una parcela.";
    renderOwnedPlot();
    return;
  }

  const { error: insertError } = await sb
    .from("plots")
    .insert({
      player_id: currentPlayerId,
      status: "owned"
    });

  if (insertError) {
    console.log("ERROR COMPRANDO PARCELA:", insertError);
    plotStatus.innerText = "❌ " + insertError.message;
    buyPlotBtn.disabled = false;
    return;
  }

  plotStatus.innerText = "✅ Parcela comprada con éxito";
  renderOwnedPlot();
}

async function initGame() {
  const ok = await loadPlayer();
  if (!ok) return;

  await loadPlot();
}

initGame();