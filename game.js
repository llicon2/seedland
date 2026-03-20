console.log("GAME INICIADO");

const SUPABASE_URL = "https://lvtpsqoqywoxrvbqfycd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dHBzcW9xeXdveHJ2YnFmeWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg1ODEsImV4cCI6MjA4ODkyNDU4MX0.AiHAyOS3zZrX3R1gPhp6GlXDOI5RO6eEF1lnLv0tnCU";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram.WebApp;

tg.ready();

const welcomeText = document.getElementById("welcomeText");
const coinsText = document.getElementById("coinsText");
const seedCountText = document.getElementById("seedCountText");

const totalSeedsText = document.getElementById("totalSeedsText");
const soldSeedsText = document.getElementById("soldSeedsText");
const remainingSeedsText = document.getElementById("remainingSeedsText");
const seedPriceText = document.getElementById("seedPriceText");
const buySeedBtn = document.getElementById("buySeedBtn");

const slotsLayer = document.getElementById("slotsLayer");
const slotInfoTitle = document.getElementById("slotInfoTitle");
const slotInfoDesc = document.getElementById("slotInfoDesc");
const slotActionBtn = document.getElementById("slotActionBtn");
const gameStatus = document.getElementById("gameStatus");

const tabFarm = document.getElementById("tabFarm");
const tabSeeds = document.getElementById("tabSeeds");
const menuFarmBtn = document.getElementById("menuFarmBtn");
const menuSeedsBtn = document.getElementById("menuSeedsBtn");

let currentPlayerId = null;
let currentPlayerName = "Jugador";
let selectedSlot = null;
let currentSlots = [];
let currentSeedPrice = 10;

const SLOT_UNLOCK_COSTS = [0, 20, 40, 70, 110, 160, 230, 320, 450];

/* posiciones encima de la tierra de tu imagen */
const SLOT_POSITIONS = {
  1: { x: 28, y: 50 },

  2: { x: 41, y: 44 },
  3: { x: 62, y: 44 },

  4: { x: 31, y: 55 },
  5: { x: 50, y: 55 },
  6: { x: 69, y: 55 },

  7: { x: 38, y: 65 },
  8: { x: 50, y: 72 },
  9: { x: 62, y: 65 }
};

const PLANT_POOL = [
  { key: "sprout", name: "Brote Verde", rarity: "Común", rate: 1, cycle: 30, icon: "🌱", chance: 25 },
  { key: "gold_grass", name: "Hierba Dorada", rarity: "Común", rate: 2, cycle: 35, icon: "🌾", chance: 18 },
  { key: "blue_daisy", name: "Margarita Azul", rarity: "Común", rate: 2, cycle: 38, icon: "🌼", chance: 12 },
  { key: "apple_root", name: "Raíz Roja", rarity: "Común", rate: 2, cycle: 40, icon: "🍎", chance: 10 },
  { key: "water_leaf", name: "Hoja de Agua", rarity: "Común", rate: 3, cycle: 45, icon: "💧", chance: 8 },
  { key: "gold_wheat", name: "Trigo Dorado", rarity: "Común", rate: 3, cycle: 45, icon: "🌿", chance: 8 },
  { key: "sunflower", name: "Girasol", rarity: "Común", rate: 3, cycle: 50, icon: "🌻", chance: 7 },
  { key: "white_flower", name: "Flor Blanca", rarity: "Común", rate: 3, cycle: 50, icon: "🤍", chance: 5 },
  { key: "root_bulb", name: "Bulbo Raíz", rarity: "Común", rate: 4, cycle: 55, icon: "🥔", chance: 3 },
  { key: "blue_crystal", name: "Cristal Azul", rarity: "Rara", rate: 6, cycle: 65, icon: "💎", chance: 2 },
  { key: "rainbow_crystal", name: "Cristal Arcoíris", rarity: "Épica", rate: 10, cycle: 80, icon: "🌈", chance: 1.2 },
  { key: "pink_lotus", name: "Loto Rosa", rarity: "Legendaria", rate: 14, cycle: 95, icon: "🌸", chance: 0.6 },
  { key: "mythic_seed", name: "Semilla Mítica", rarity: "Mítica", rate: 22, cycle: 120, icon: "✨", chance: 0.2 }
];

buySeedBtn.addEventListener("click", buySeed);
slotActionBtn.addEventListener("click", handleSlotAction);
menuFarmBtn.addEventListener("click", () => switchTab("farm"));
menuSeedsBtn.addEventListener("click", () => switchTab("seeds"));

function getTelegramUser() {
  return tg.initDataUnsafe?.user || null;
}

function switchTab(tabName) {
  tabFarm.classList.remove("active");
  tabSeeds.classList.remove("active");
  menuFarmBtn.classList.remove("active");
  menuSeedsBtn.classList.remove("active");

  if (tabName === "farm") {
    tabFarm.classList.add("active");
    menuFarmBtn.classList.add("active");
  } else {
    tabSeeds.classList.add("active");
    menuSeedsBtn.classList.add("active");
  }
}

function getWeightedPlant() {
  const total = PLANT_POOL.reduce((sum, plant) => sum + plant.chance, 0);
  let random = Math.random() * total;

  for (const plant of PLANT_POOL) {
    random -= plant.chance;
    if (random <= 0) return plant;
  }

  return PLANT_POOL[0];
}

function getSlotUnlockCost(slotIndex) {
  return SLOT_UNLOCK_COSTS[slotIndex - 1] ?? 9999;
}

function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function getPendingProduction(slot) {
  if (!slot.plant_type || !slot.last_collected_at) return 0;

  const now = Date.now();
  const last = new Date(slot.last_collected_at).getTime();
  const cycleMs = (slot.cycle_seconds || 30) * 1000;

  const cycles = Math.floor((now - last) / cycleMs);
  return Math.max(0, cycles * (slot.production_rate || 0));
}

async function getPlayerCoins() {
  const { data, error } = await sb
    .from("players")
    .select("coins")
    .eq("telegram_id", currentPlayerId)
    .single();

  if (error) return 0;
  return data?.coins || 0;
}

async function setPlayerCoins(newCoins) {
  const { error } = await sb
    .from("players")
    .update({ coins: newCoins })
    .eq("telegram_id", currentPlayerId);

  return !error;
}

async function loadPlayer() {
  const user = getTelegramUser();

  if (!user) {
    welcomeText.innerText = "❌ Abre esta app desde Telegram";
    return false;
  }

  currentPlayerId = Number(user.id);
  currentPlayerName = user.first_name || "Jugador";

  const { data, error } = await sb
    .from("players")
    .select("telegram_id, name")
    .eq("telegram_id", currentPlayerId)
    .maybeSingle();

  if (error || !data) {
    welcomeText.innerText = "❌ Primero debes preregistrarte";
    return false;
  }

  welcomeText.innerText = `Bienvenido, ${currentPlayerName} 👑`;
  return true;
}

async function ensureInventory() {
  const { data } = await sb
    .from("player_inventory")
    .select("player_id")
    .eq("player_id", currentPlayerId)
    .maybeSingle();

  if (!data) {
    await sb.from("player_inventory").insert({
      player_id: currentPlayerId,
      seed_count: 0
    });
  }
}

async function ensureSlots() {
  const { data, error } = await sb
    .from("farm_slots")
    .select("slot_index")
    .eq("player_id", currentPlayerId);

  if (error) return;

  const existing = new Set((data || []).map(row => row.slot_index));

  for (let i = 1; i <= 9; i++) {
    if (!existing.has(i)) {
      await sb.from("farm_slots").insert({
        player_id: currentPlayerId,
        slot_index: i,
        is_unlocked: i === 1
      });
    }
  }
}

async function loadWallet() {
  const coins = await getPlayerCoins();

  const { data, error } = await sb
    .from("player_inventory")
    .select("seed_count")
    .eq("player_id", currentPlayerId)
    .single();

  if (!error) {
    seedCountText.innerText = `🌰 ${data.seed_count || 0}`;
  }

  coinsText.innerText = `💎 ${coins}`;
}

async function loadSeedShop() {
  const { data, error } = await sb
    .from("game_config")
    .select("*")
    .eq("config_key", "main")
    .single();

  if (error || !data) return;

  currentSeedPrice = data.seed_price || 10;

  totalSeedsText.innerText = data.total_seeds;
  soldSeedsText.innerText = data.sold_seeds;
  remainingSeedsText.innerText = data.total_seeds - data.sold_seeds;
  seedPriceText.innerText = currentSeedPrice;
}

async function buySeed() {
  if (!currentPlayerId) return;

  gameStatus.innerText = "⏳ Comprando semilla...";

  const { data: config, error: configError } = await sb
    .from("game_config")
    .select("*")
    .eq("config_key", "main")
    .single();

  if (configError || !config) {
    gameStatus.innerText = "❌ Error cargando stock de semillas";
    return;
  }

  const remaining = config.total_seeds - config.sold_seeds;
  if (remaining <= 0) {
    gameStatus.innerText = "❌ No quedan semillas disponibles";
    return;
  }

  const coins = await getPlayerCoins();
  if (coins < config.seed_price) {
    gameStatus.innerText = `❌ Necesitas ${config.seed_price} monedas para comprar una semilla`;
    return;
  }

  const { data: inv, error: invError } = await sb
    .from("player_inventory")
    .select("seed_count")
    .eq("player_id", currentPlayerId)
    .single();

  if (invError || !inv) {
    gameStatus.innerText = "❌ Error cargando inventario";
    return;
  }

  const okCoins = await setPlayerCoins(coins - config.seed_price);
  if (!okCoins) {
    gameStatus.innerText = "❌ No se pudieron descontar monedas";
    return;
  }

  const { error: invUpdateError } = await sb
    .from("player_inventory")
    .update({ seed_count: (inv.seed_count || 0) + 1 })
    .eq("player_id", currentPlayerId);

  if (invUpdateError) {
    gameStatus.innerText = "❌ No se pudo sumar la semilla";
    return;
  }

  const { error: configUpdateError } = await sb
    .from("game_config")
    .update({ sold_seeds: config.sold_seeds + 1 })
    .eq("config_key", "main");

  if (configUpdateError) {
    gameStatus.innerText = "❌ No se pudo actualizar el stock";
    return;
  }

  gameStatus.innerText = "🌰 Semilla comprada con éxito";
  await loadWallet();
  await loadSeedShop();
}

async function loadSlots() {
  const { data, error } = await sb
    .from("farm_slots")
    .select("*")
    .eq("player_id", currentPlayerId)
    .order("slot_index", { ascending: true });

  if (error) {
    gameStatus.innerText = "❌ Error cargando slots";
    return;
  }

  currentSlots = data || [];
  renderSlots();
}

function getPlantIcon(plantType) {
  const plant = PLANT_POOL.find(p => p.name === plantType);
  return plant?.icon || "🌱";
}

function renderSlots() {
  slotsLayer.innerHTML = "";

  currentSlots.forEach(slot => {
    const pos = SLOT_POSITIONS[slot.slot_index];
    const button = document.createElement("button");
    button.classList.add("slot-spot");

    if (selectedSlot && selectedSlot.slot_index === slot.slot_index) {
      button.classList.add("selected");
    }

    if (!slot.is_unlocked) {
      button.classList.add("locked");
      button.style.left = `${pos.x}%`;
      button.style.top = `${pos.y}%`;
      button.innerHTML = `
        <div class="slot-inner">
          <div class="slot-lock">🔒</div>
          <div class="slot-cost">${getSlotUnlockCost(slot.slot_index)} 💎</div>
        </div>
      `;
    } else if (!slot.plant_type) {
      button.classList.add("empty");
      button.style.left = `${pos.x}%`;
      button.style.top = `${pos.y}%`;
      button.innerHTML = `
        <div class="slot-inner"></div>
      `;
    } else {
      const pending = getPendingProduction(slot);
      button.classList.add(pending > 0 ? "ready" : "planted");
      button.style.left = `${pos.x}%`;
      button.style.top = `${pos.y}%`;
      button.innerHTML = `
        <div class="slot-inner">
          <div class="slot-plant">${getPlantIcon(slot.plant_type)}</div>
          <div class="slot-badge">+${pending}</div>
        </div>
      `;
    }

    button.addEventListener("click", () => {
      selectedSlot = slot;
      updateSelectedSlotPanel();
      renderSlots();
    });

    slotsLayer.appendChild(button);
  });

  if (!selectedSlot && currentSlots.length > 0) {
    selectedSlot = currentSlots[0];
    updateSelectedSlotPanel();
    renderSlots();
  }
}

function updateSelectedSlotPanel() {
  if (!selectedSlot) {
    slotInfoTitle.innerText = "Selecciona un slot";
    slotInfoDesc.innerText = "Aquí verás el estado del slot.";
    slotActionBtn.disabled = true;
    slotActionBtn.innerText = "Selecciona un slot";
    return;
  }

  if (!selectedSlot.is_unlocked) {
    const cost = getSlotUnlockCost(selectedSlot.slot_index);
    slotInfoTitle.innerText = `Slot ${selectedSlot.slot_index} bloqueado`;
    slotInfoDesc.innerText = `Desbloquea este espacio por ${cost} monedas.`;
    slotActionBtn.disabled = false;
    slotActionBtn.innerText = `Desbloquear (${cost})`;
    return;
  }

  if (!selectedSlot.plant_type) {
    slotInfoTitle.innerText = `Slot ${selectedSlot.slot_index} vacío`;
    slotInfoDesc.innerText = `Puedes plantar aquí una semilla de tu inventario.`;
    slotActionBtn.disabled = false;
    slotActionBtn.innerText = `Plantar semilla`;
    return;
  }

  const pending = getPendingProduction(selectedSlot);
  const plant = PLANT_POOL.find(p => p.name === selectedSlot.plant_type);

  if (pending > 0) {
    slotInfoTitle.innerText = selectedSlot.plant_type;
    slotInfoDesc.innerText = `Rareza: ${selectedSlot.plant_rarity} · Producción lista: ${pending}`;
    slotActionBtn.disabled = false;
    slotActionBtn.innerText = `Recolectar (${pending})`;
  } else {
    const cycle = plant?.cycle || selectedSlot.cycle_seconds || 30;
    const elapsed = Math.floor((Date.now() - new Date(selectedSlot.last_collected_at).getTime()) / 1000);
    const left = Math.max(0, cycle - elapsed);

    slotInfoTitle.innerText = selectedSlot.plant_type;
    slotInfoDesc.innerText = `Rareza: ${selectedSlot.plant_rarity} · Próxima producción en ${formatSeconds(left)}`;
    slotActionBtn.disabled = true;
    slotActionBtn.innerText = `Produciendo...`;
  }
}

async function handleSlotAction() {
  if (!selectedSlot) return;

  if (!selectedSlot.is_unlocked) {
    await unlockSlot(selectedSlot);
    return;
  }

  if (!selectedSlot.plant_type) {
    await plantSeedInSlot(selectedSlot);
    return;
  }

  await collectFromSlot(selectedSlot);
}

async function unlockSlot(slot) {
  const cost = getSlotUnlockCost(slot.slot_index);
  const coins = await getPlayerCoins();

  if (coins < cost) {
    gameStatus.innerText = `❌ Necesitas ${cost} monedas para desbloquear este slot`;
    return;
  }

  const okCoins = await setPlayerCoins(coins - cost);
  if (!okCoins) {
    gameStatus.innerText = "❌ No se pudieron descontar monedas";
    return;
  }

  const { error } = await sb
    .from("farm_slots")
    .update({ is_unlocked: true })
    .eq("id", slot.id);

  if (error) {
    gameStatus.innerText = "❌ No se pudo desbloquear el slot";
    return;
  }

  gameStatus.innerText = `✅ Slot ${slot.slot_index} desbloqueado`;
  await loadWallet();
  await loadSlots();
}

async function plantSeedInSlot(slot) {
  const { data: inv, error: invError } = await sb
    .from("player_inventory")
    .select("seed_count")
    .eq("player_id", currentPlayerId)
    .single();

  if (invError || !inv) {
    gameStatus.innerText = "❌ Error cargando inventario";
    return;
  }

  if ((inv.seed_count || 0) <= 0) {
    gameStatus.innerText = "❌ No tienes semillas. Compra una en la pestaña Semillas.";
    return;
  }

  const plant = getWeightedPlant();
  const nowIso = new Date().toISOString();

  const { error: slotUpdateError } = await sb
    .from("farm_slots")
    .update({
      plant_type: plant.name,
      plant_rarity: plant.rarity,
      production_rate: plant.rate,
      cycle_seconds: plant.cycle,
      planted_at: nowIso,
      last_collected_at: nowIso
    })
    .eq("id", slot.id);

  if (slotUpdateError) {
    gameStatus.innerText = "❌ No se pudo plantar";
    return;
  }

  const { error: invUpdateError } = await sb
    .from("player_inventory")
    .update({ seed_count: (inv.seed_count || 0) - 1 })
    .eq("player_id", currentPlayerId);

  if (invUpdateError) {
    gameStatus.innerText = "❌ No se pudo descontar la semilla";
    return;
  }

  gameStatus.innerText = `🌱 Plantaste y apareció: ${plant.name} (${plant.rarity})`;
  await loadWallet();
  await loadSlots();
}

async function collectFromSlot(slot) {
  const pending = getPendingProduction(slot);

  if (pending <= 0) {
    gameStatus.innerText = "⏳ Aún no hay producción lista";
    return;
  }

  const coins = await getPlayerCoins();
  const newCoins = coins + pending;

  const okCoins = await setPlayerCoins(newCoins);
  if (!okCoins) {
    gameStatus.innerText = "❌ No se pudieron sumar monedas";
    return;
  }

  const { error } = await sb
    .from("farm_slots")
    .update({
      last_collected_at: new Date().toISOString()
    })
    .eq("id", slot.id);

  if (error) {
    gameStatus.innerText = "❌ No se pudo actualizar la recolección";
    return;
  }

  gameStatus.innerText = `🌾 Recolectaste ${pending} monedas de ${slot.plant_type}`;
  await loadWallet();
  await loadSlots();
}

async function initGame() {
  const ok = await loadPlayer();
  if (!ok) return;

  await ensureInventory();
  await ensureSlots();
  await loadWallet();
  await loadSeedShop();
  await loadSlots();

  setInterval(() => {
    if (tabFarm.classList.contains("active")) {
      updateSelectedSlotPanel();
      renderSlots();
    }
  }, 1000);
}

initGame();