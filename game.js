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
buySeedBtn.addEventListener("click", handleSeedAction);

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

  plotStatus.innerText = "✅ Parcela lista para plantar";

  buyPlotBtn.innerText = "✅ Parcela comprada";
  buyPlotBtn.disabled = true;

  buySeedBtn.disabled = false;
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
    await loadSeed();
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
  await loadSeed();
}

async function loadSeed() {
  if (!currentPlayerId) return;

  const { data, error } = await sb
    .from("seeds")
    .select("*")
    .eq("player_id", currentPlayerId)
    .maybeSingle();

  if (error) {
    console.log("ERROR CARGANDO SEMILLA:", error);
    plotStatus.innerText = "❌ Error cargando semilla";
    return;
  }

  if (!data) {
    seedVisual.innerText = "🌰";
    buySeedBtn.innerText = "Comprar semilla";
    return;
  }

  if (data.status === "idle") {
    seedVisual.innerText = "🌱";
    buySeedBtn.innerText = "Plantar";
    return;
  }

  if (data.status === "growing") {
    const now = new Date();
    const ready = new Date(data.ready_at);

    if (now >= ready) {
      seedVisual.innerText = "🌾";
      buySeedBtn.innerText = "Cosechar";
    } else {
      seedVisual.innerText = "🌿";
      buySeedBtn.innerText = "Creciendo...";
    }
  }
}

async function handleSeedAction() {
  if (!currentPlayerId) return;

  const { data: plotData, error: plotError } = await sb
    .from("plots")
    .select("id")
    .eq("player_id", currentPlayerId)
    .maybeSingle();

  if (plotError) {
    console.log("ERROR REVISANDO PARCELA PARA SEMILLA:", plotError);
    plotStatus.innerText = "❌ Error revisando parcela";
    return;
  }

  if (!plotData) {
    plotStatus.innerText = "❌ Primero necesitas una parcela";
    return;
  }

  const { data, error } = await sb
    .from("seeds")
    .select("*")
    .eq("player_id", currentPlayerId)
    .maybeSingle();

  if (error) {
    console.log("ERROR CON SEMILLA:", error);
    plotStatus.innerText = "❌ Error con semilla";
    return;
  }

  if (!data) {
    const { error: insertSeedError } = await sb
      .from("seeds")
      .insert({
        player_id: currentPlayerId,
        type: "trigo",
        status: "idle"
      });

    if (insertSeedError) {
      console.log("ERROR COMPRANDO SEMILLA:", insertSeedError);
      plotStatus.innerText = "❌ " + insertSeedError.message;
      return;
    }

    plotStatus.innerText = "🌱 Semilla comprada";
    seedVisual.innerText = "🌱";
    buySeedBtn.innerText = "Plantar";
    return;
  }

  if (data.status === "idle") {
    const now = new Date();
    const ready = new Date(now.getTime() + 30000);

    const { error: updateSeedError } = await sb
      .from("seeds")
      .update({
        status: "growing",
        planted_at: now.toISOString(),
        ready_at: ready.toISOString()
      })
      .eq("id", data.id);

    if (updateSeedError) {
      console.log("ERROR PLANTANDO SEMILLA:", updateSeedError);
      plotStatus.innerText = "❌ " + updateSeedError.message;
      return;
    }

    plotStatus.innerText = "🌿 Semilla plantada, estará lista en 30 segundos";
    seedVisual.innerText = "🌿";
    buySeedBtn.innerText = "Creciendo...";
    return;
  }

  if (data.status === "growing") {
    const now = new Date();
    const ready = new Date(data.ready_at);

    if (now >= ready) {
      const { data: playerData, error: playerError } = await sb
        .from("players")
        .select("coins")
        .eq("telegram_id", currentPlayerId)
        .single();

      if (playerError) {
        console.log("ERROR OBTENIENDO MONEDAS:", playerError);
        plotStatus.innerText = "❌ Error obteniendo monedas";
        return;
      }

      const newCoins = (playerData?.coins || 0) + 10;

      const { error: updateCoinsError } = await sb
        .from("players")
        .update({ coins: newCoins })
        .eq("telegram_id", currentPlayerId);

      if (updateCoinsError) {
        console.log("ERROR SUMANDO MONEDAS:", updateCoinsError);
        plotStatus.innerText = "❌ Error sumando monedas";
        return;
      }

      const { error: deleteSeedError } = await sb
        .from("seeds")
        .delete()
        .eq("id", data.id);

      if (deleteSeedError) {
        console.log("ERROR COSECHANDO:", deleteSeedError);
        plotStatus.innerText = "❌ " + deleteSeedError.message;
        return;
      }

      plotStatus.innerText = `🌾 Cosechado +10 monedas (Total: ${newCoins})`;
      seedVisual.innerText = "🌰";
      buySeedBtn.innerText = "Comprar semilla";
    } else {
      const secondsLeft = Math.max(
        0,
        Math.ceil((ready.getTime() - now.getTime()) / 1000)
      );

      plotStatus.innerText = `⏳ Aún creciendo... ${secondsLeft}s`;
      seedVisual.innerText = "🌿";
      buySeedBtn.innerText = "Creciendo...";
    }
  }
}

async function initGame() {
  const ok = await loadPlayer();
  if (!ok) return;

  await loadPlot();
  await loadSeed();
}

initGame();