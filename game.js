console.log("GAME INICIADO");

const SUPABASE_URL = "https://lvtpsqoqywoxrvbqfycd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dHBzcW9xeXdveHJ2YnFmeWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg1ODEsImV4cCI6MjA4ODkyNDU4MX0.AiHAyOS3zZrX3R1gPhp6GlXDOI5RO6eEF1lnLv0tnCU";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram.WebApp;

tg.ready();

/* =========================
   DEBUG PARA MOVER SLOTS :)
========================= */
const DEBUG_MOVE_SLOTS = false;

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

const slotModal = document.getElementById("slotModal");
const closeSlotModalBtn = document.getElementById("closeSlotModalBtn");
const slotModalPlant = document.getElementById("slotModalPlant");
const slotModalTitle = document.getElementById("slotModalTitle");
const slotModalDesc = document.getElementById("slotModalDesc");
const slotModalRarity = document.getElementById("slotModalRarity");
const slotModalRate = document.getElementById("slotModalRate");
const slotModalState = document.getElementById("slotModalState");
const slotModalWater = document.getElementById("slotModalWater");
const slotModalActionBtn = document.getElementById("slotModalActionBtn");

const tabFarm = document.getElementById("tabFarm");
const tabSeeds = document.getElementById("tabSeeds");
const menuFarmBtn = document.getElementById("menuFarmBtn");
const menuSeedsBtn = document.getElementById("menuSeedsBtn");

let currentPlayerId = null;      // telegram_id
let currentPlayerRowId = null;   // id interno de la tabla players
let currentPlayerName = "Jugador";
let selectedSlot = null;
let currentSlots = [];
let currentSeedPrice = 10;
let isDraggingAnySlot = false;

const SLOT_UNLOCK_COSTS = [0, 20, 40, 70, 110, 160, 230, 320, 450];

/* POSICIONES BASE */
const SLOT_POSITIONS = {
  1: { x: 32, y: 48 },
  2: { x: 42, y: 42 },
  3: { x: 53, y: 36 },
  4: { x: 42, y: 52 },
  5: { x: 52, y: 48 },
  6: { x: 63, y: 41 },
  7: { x: 52, y: 57 },
  8: { x: 62, y: 53 },
  9: { x: 73, y: 48 }
};

/* ESTE OBJETO SÍ SE ACTUALIZA AL ARRASTRAR */
const liveSlotPositions = JSON.parse(JSON.stringify(SLOT_POSITIONS));

const PLANT_POOL = [
  { key: "brote_verde",       name: "Brote Verde",        rarity: "Común",      rate: 1,  cycle: 30,  icon: "🌱", image: "images/plants/1brote_verde.png",       chance: 25 },
  { key: "hoja_agua",         name: "Hoja de Agua",       rarity: "Común",      rate: 2,  cycle: 35,  icon: "💧", image: "images/plants/2acuatic_water.png",      chance: 18 },
  { key: "bulbo_raiz",        name: "Bulbo Raíz",         rarity: "Común",      rate: 2,  cycle: 38,  icon: "🥔", image: "images/plants/3bulbo_terrenal.png",    chance: 12 },
  { key: "girasol",           name: "Girasol",            rarity: "Común",      rate: 2,  cycle: 40,  icon: "🌻", image: "images/plants/4girasol.png",           chance: 10 },
  { key: "hierba_dorada",     name: "Hierba Dorada",      rarity: "Común",      rate: 3,  cycle: 45,  icon: "🌿", image: "images/plants/5hierba_dorada.png",     chance: 8 },
  { key: "flor_blanca",       name: "Flor Blanca",        rarity: "Común",      rate: 3,  cycle: 45,  icon: "🤍", image: "images/plants/6manzanilla.png",        chance: 8 },
  { key: "trigo_dorado",      name: "Trigo Dorado",       rarity: "Común",      rate: 3,  cycle: 50,  icon: "🌾", image: "images/plants/7trigo.png",              chance: 7 },
  { key: "loto_rosa",         name: "Loto Rosa",          rarity: "Rara",       rate: 3,  cycle: 50,  icon: "🌸", image: "images/plants/8loto_rosado.png",        chance: 5 },
  { key: "margarita_azul",    name: "Margarita Azul",     rarity: "Rara",       rate: 4,  cycle: 55,  icon: "🌼", image: "images/plants/9margarita_azul.png",     chance: 3 },
  { key: "rabano_rojo",       name: "Rábano Rojo",        rarity: "Rara",       rate: 6,  cycle: 65,  icon: "❤️", image: "images/plants/10Rabano.png",            chance: 2 },
  { key: "planta_cristalina", name: "Planta Cristalina",  rarity: "Épica",      rate: 10, cycle: 80,  icon: "✨", image: "images/plants/11planta_cristalina.png", chance: 1.2 },
  { key: "cristal_arcoiris",  name: "Cristal Arcoíris",   rarity: "Legendaria", rate: 14, cycle: 95,  icon: "🌈", image: "images/plants/12cristal_arcoiris.png",  chance: 0.6 }
];

buySeedBtn?.addEventListener("click", buySeed);
slotActionBtn?.addEventListener("click", handleSlotAction);
slotModalActionBtn?.addEventListener("click", handleSlotAction);
closeSlotModalBtn?.addEventListener("click", closeSlotModal);
menuFarmBtn?.addEventListener("click", () => switchTab("farm"));
menuSeedsBtn?.addEventListener("click", () => switchTab("seeds"));

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
  if (hasCrowOnSlot(slot)) return 0;
  if (needsWater(slot)) return 0;

  const now = Date.now();
  const last = new Date(slot.last_collected_at).getTime();
  const cycleMs = (slot.cycle_seconds || 30) * 1000;

  const cycles = Math.floor((now - last) / cycleMs);
  return Math.max(0, cycles * (slot.production_rate || 0));
}

function getPlantIcon(plantType) {
  const plant = PLANT_POOL.find(p => p.name === plantType);
  return plant?.icon || "🌱";
}

function getPlantImage(plantType) {
  const plant = PLANT_POOL.find(p => p.name === plantType);
  return plant?.image || "";
}

function getSlotWaterPercent(slot) {
  if (typeof slot.water_percent === "number") return slot.water_percent;
  return 100;
}

function hasCrowOnSlot(slot) {
  return slot.has_crow === true;
}

function needsWater(slot) {
  return getSlotWaterPercent(slot) <= 30;
}

function getSlotStatusLabel(slot) {
  if (!slot.is_unlocked) return "Bloqueado";
  if (!slot.plant_type) return "Vacío";
  if (hasCrowOnSlot(slot)) return "Cuervo";
  if (needsWater(slot)) return "Seca";

  const pending = getPendingProduction(slot);
  if (pending > 0) return "Lista";

  return "Produciendo";
}

function getPrimaryActionForSlot(slot) {
  if (!slot.is_unlocked) {
    return {
      key: "unlock",
      label: `Desbloquear (${getSlotUnlockCost(slot.slot_index)})`,
      disabled: false
    };
  }

  if (!slot.plant_type) {
    return {
      key: "plant",
      label: "Plantar semilla",
      disabled: false
    };
  }

  if (hasCrowOnSlot(slot)) {
    return {
      key: "crow",
      label: "Espantar cuervo",
      disabled: false
    };
  }

  if (needsWater(slot)) {
    return {
      key: "water",
      label: "Regar planta",
      disabled: false
    };
  }

  const pending = getPendingProduction(slot);
  if (pending > 0) {
    return {
      key: "collect",
      label: `Recolectar (${pending})`,
      disabled: false
    };
  }

  return {
    key: "wait",
    label: "Produciendo...",
    disabled: true
  };
}

async function getPlayerCoins() {
  if (!currentPlayerRowId) return 0;

  const { data, error } = await sb
    .from("players")
    .select("coins")
    .eq("id", currentPlayerRowId)
    .single();

  if (error) {
    console.log("ERROR getPlayerCoins:", error);
    return 0;
  }

  return data?.coins || 0;
}

async function setPlayerCoins(newCoins) {
  if (!currentPlayerRowId) return false;

  const { error } = await sb
    .from("players")
    .update({ coins: newCoins })
    .eq("id", currentPlayerRowId);

  if (error) {
    console.log("ERROR setPlayerCoins:", error);
    return false;
  }

  return true;
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
    .select("id, telegram_id, name, coins")
    .eq("telegram_id", currentPlayerId)
    .maybeSingle();

  if (error || !data) {
    welcomeText.innerText = "❌ Primero debes preregistrarte";
    return false;
  }

  currentPlayerRowId = data.id;
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
        is_unlocked: i === 1,
        water_percent: 100,
        has_crow: false
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

function openSlotModal(slot) {
  selectedSlot = slot;
  updateSlotModal();
  slotModal.classList.remove("hidden");
}

function closeSlotModal() {
  slotModal.classList.add("hidden");
}

function updateSlotModal() {
  if (!selectedSlot) return;

  const action = getPrimaryActionForSlot(selectedSlot);
  const water = getSlotWaterPercent(selectedSlot);
  const crow = hasCrowOnSlot(selectedSlot);
  const status = getSlotStatusLabel(selectedSlot);

  slotModalActionBtn.dataset.action = action.key;
  slotModalActionBtn.disabled = action.disabled;
  slotModalActionBtn.innerText = action.label;

  if (!selectedSlot.is_unlocked) {
    slotModalPlant.innerHTML = `<div style="font-size:72px;">🔒</div>`;
    slotModalTitle.innerText = `Slot ${selectedSlot.slot_index}`;
    slotModalDesc.innerText = "Espacio bloqueado";
    slotModalRarity.innerText = "-";
    slotModalRate.innerText = "-";
    slotModalState.innerText = "Bloqueado";
    slotModalWater.innerText = "-";
    return;
  }

  if (!selectedSlot.plant_type) {
    slotModalPlant.innerHTML = `<div style="font-size:72px;">🕳️</div>`;
    slotModalTitle.innerText = `Slot ${selectedSlot.slot_index}`;
    slotModalDesc.innerText = "Espacio vacío";
    slotModalRarity.innerText = "-";
    slotModalRate.innerText = "-";
    slotModalState.innerText = "Vacío";
    slotModalWater.innerText = "-";
    return;
  }

  const plant = PLANT_POOL.find(p => p.name === selectedSlot.plant_type);
  const pending = getPendingProduction(selectedSlot);
  const plantImage = getPlantImage(selectedSlot.plant_type);
  const perHour = Math.floor((3600 / (selectedSlot.cycle_seconds || 30)) * (selectedSlot.production_rate || 0));

  slotModalPlant.innerHTML = plantImage
    ? `<img class="slot-modal-plant-img" src="${plantImage}" alt="${selectedSlot.plant_type}">`
    : `<div style="font-size:84px;">${getPlantIcon(selectedSlot.plant_type)}</div>`;

  slotModalTitle.innerText = selectedSlot.plant_type;
  slotModalDesc.innerText = `${selectedSlot.plant_rarity || "Común"} · ${status}`;
  slotModalRarity.innerText = selectedSlot.plant_rarity || "-";
  slotModalRate.innerText = `${perHour}`;
  slotModalWater.innerText = `${water}%`;

  if (crow) {
    slotModalState.innerText = "Cuervo bloqueando";
    return;
  }

  if (needsWater(selectedSlot)) {
    slotModalState.innerText = "Necesita agua";
    return;
  }

  if (pending > 0) {
    slotModalState.innerText = `Lista · ${pending}`;
    return;
  }

  const cycle = plant?.cycle || selectedSlot.cycle_seconds || 30;
  const elapsed = Math.floor((Date.now() - new Date(selectedSlot.last_collected_at).getTime()) / 1000);
  const left = Math.max(0, cycle - elapsed);

  slotModalState.innerText = `En ${formatSeconds(left)}`;
}

function enableDebugDrag(slotElement, slotId) {
  if (!DEBUG_MOVE_SLOTS) return;

  let isDragging = false;

  const onPointerMove = (e) => {
    if (!isDragging) return;

    const rect = slotsLayer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const xRounded = Math.max(0, Math.min(100, Math.round(x)));
    const yRounded = Math.max(0, Math.min(100, Math.round(y)));

    liveSlotPositions[slotId] = { x: xRounded, y: yRounded };

    slotElement.style.left = `${xRounded}%`;
    slotElement.style.top = `${yRounded}%`;

    gameStatus.innerText = `Moviendo slot ${slotId} → x:${xRounded}, y:${yRounded}`;
    isDraggingAnySlot = true;
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    isDraggingAnySlot = false;

    const pos = liveSlotPositions[slotId];
    console.log(`SLOT ${slotId}: { x: ${pos.x}, y: ${pos.y} }`);
    console.log(`${slotId}: { x: ${pos.x}, y: ${pos.y} },`);

    gameStatus.innerText = `Guardado visual slot ${slotId} → ${slotId}: { x: ${pos.x}, y: ${pos.y} },`;
  };

  slotElement.addEventListener("pointerdown", (e) => {
    if (!DEBUG_MOVE_SLOTS) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    isDraggingAnySlot = true;
    slotElement.setPointerCapture?.(e.pointerId);
  });

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
}

function renderSlots() {
  slotsLayer.innerHTML = "";

  currentSlots.forEach(slot => {
    const pos = liveSlotPositions[slot.slot_index] || SLOT_POSITIONS[slot.slot_index];
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("slot-spot");

    if (DEBUG_MOVE_SLOTS) {
      button.style.cursor = "move";
    }

    if (selectedSlot && selectedSlot.slot_index === slot.slot_index) {
      button.classList.add("selected");
    }

    button.style.left = `${pos.x}%`;
    button.style.top = `${pos.y}%`;

    if (!slot.is_unlocked) {
      button.classList.add("locked");
      button.innerHTML = `
        <div class="slot-inner">
          <div class="slot-lock">🔒</div>
          <div class="slot-cost">${getSlotUnlockCost(slot.slot_index)} 💎</div>
        </div>
      `;
    } else if (!slot.plant_type) {
      button.classList.add("empty");
      button.innerHTML = `<div class="slot-inner"></div>`;
    } else {
      const pending = getPendingProduction(slot);
      const plantImage = getPlantImage(slot.plant_type);

      button.classList.add(pending > 0 ? "ready" : "planted");
      button.innerHTML = `
        <div class="slot-inner">
          <img class="slot-plant-img" src="${plantImage}" alt="${slot.plant_type}">
          <div class="slot-badge">+${pending}</div>
        </div>
      `;
    }

    button.addEventListener("click", () => {
      if (isDraggingAnySlot) return;
      selectedSlot = slot;
      renderSlots();
      openSlotModal(slot);
    });

    enableDebugDrag(button, slot.slot_index);
    slotsLayer.appendChild(button);
  });

  if (!selectedSlot && currentSlots.length > 0) {
    selectedSlot = currentSlots[0];
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

  const action = slotModalActionBtn?.dataset.action || getPrimaryActionForSlot(selectedSlot).key;

  if (action === "unlock") {
    await unlockSlot(selectedSlot);
    return;
  }

  if (action === "plant") {
    await plantSeedInSlot(selectedSlot);
    return;
  }

  if (action === "collect") {
    await collectFromSlot(selectedSlot);
    return;
  }

  if (action === "water") {
    await waterSlot(selectedSlot);
    return;
  }

  if (action === "crow") {
    await removeCrowFromSlot(selectedSlot);
    return;
  }
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
      last_collected_at: nowIso,
      water_percent: 100,
      has_crow: false
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

async function waterSlot(slot) {
  if (!slot || !slot.id) return;

  const { error } = await sb
    .from("farm_slots")
    .update({
      water_percent: 100
    })
    .eq("id", slot.id);

  if (error) {
    gameStatus.innerText = "❌ No se pudo regar la planta";
    return;
  }

  gameStatus.innerText = `💧 Regaste ${slot.plant_type}`;
  await loadSlots();
}

async function removeCrowFromSlot(slot) {
  if (!slot || !slot.id) return;

  const { error } = await sb
    .from("farm_slots")
    .update({
      has_crow: false
    })
    .eq("id", slot.id);

  if (error) {
    gameStatus.innerText = "❌ No se pudo espantar el cuervo";
    return;
  }

  gameStatus.innerText = `🐦 Espantaste el cuervo de ${slot.plant_type}`;
  await loadSlots();
}

async function collectFromSlot(slot) {
  if (hasCrowOnSlot(slot)) {
    gameStatus.innerText = "🐦 Hay un cuervo bloqueando la producción";
    return;
  }

  if (needsWater(slot)) {
    gameStatus.innerText = "💧 La planta necesita agua antes de producir";
    return;
  }

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

  if (!DEBUG_MOVE_SLOTS) {
    setInterval(() => {
      if (tabFarm.classList.contains("active")) {
        renderSlots();

        if (!slotModal.classList.contains("hidden") && selectedSlot) {
          const refreshedSlot = currentSlots.find(
            s => s.slot_index === selectedSlot.slot_index
          );

          if (refreshedSlot) {
            selectedSlot = refreshedSlot;
            updateSlotModal();
          }
        }
      }
    }, 1000);
  }
}

initGame();