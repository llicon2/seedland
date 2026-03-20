console.log("APP INICIADA");

const SUPABASE_URL = "https://lvtpsqoqywoxrvbqfycd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dHBzcW9xeXdveHJ2YnFmeWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg1ODEsImV4cCI6MjA4ODkyNDU4MX0.AiHAyOS3zZrX3R1gPhp6GlXDOI5RO6eEF1lnLv0tnCU";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram.WebApp;

tg.ready();

const btn = document.getElementById("btn");
const copyRefBtn = document.getElementById("copyRefBtn");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const myRefCountEl = document.getElementById("myRefCount");
const refLinkEl = document.getElementById("refLink");
const nextRewardEl = document.getElementById("nextReward");
const myItemsEl = document.getElementById("myItems");
const debugRefEl = document.getElementById("debugRef");

btn.addEventListener("click", preregister);
copyRefBtn.addEventListener("click", copyReferralLink);

function getTelegramUser() {
  return tg.initDataUnsafe?.user || null;
}

function getReferrerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (!ref) return null;

  const parsed = Number(ref);
  return Number.isNaN(parsed) ? null : parsed;
}

function getReferralLink(userId) {
  return `https://t.me/seedlands_bot?start=${userId}`;
}

function getNextReward(refCount) {
  if (refCount < 3) return "Invita 3 amigos para ganar 🐦 Radar de Cuervos x1";
  if (refCount < 5) return "Invita 5 amigos para ganar 🦊 Rastreador de Zorros x1";
  if (refCount < 10) return "Invita 10 amigos para ganar 🛡️ Espantapájaros (12h)";
  if (refCount < 20) return "Invita 20 amigos para ganar 🐺 Espanta Zorros (12h)";
  return "🎉 Has desbloqueado todas las recompensas del preregistro";
}

function getMilestoneRewards(refCount) {
  const rewards = [];

  if (refCount >= 3) rewards.push({ milestone: 3, item_key: "crow_radar", quantity: 1 });
  if (refCount >= 5) rewards.push({ milestone: 5, item_key: "fox_tracker", quantity: 1 });
  if (refCount >= 10) rewards.push({ milestone: 10, item_key: "scarecrow_12h", quantity: 1 });
  if (refCount >= 20) rewards.push({ milestone: 20, item_key: "fox_repellent_12h", quantity: 1 });

  return rewards;
}

function getItemLabel(itemKey) {
  if (itemKey === "crow_radar") return "🐦 Radar de Cuervos x1";
  if (itemKey === "fox_tracker") return "🦊 Rastreador de Zorros x1";
  if (itemKey === "scarecrow_12h") return "🛡️ Espantapájaros (12h)";
  if (itemKey === "fox_repellent_12h") return "🐺 Espanta Zorros (12h)";
  return itemKey;
}

async function preregister() {
  const user = getTelegramUser();

  if (!user) {
    statusEl.innerText = "❌ Abre esta app desde Telegram";
    return;
  }

  statusEl.innerText = "⏳ Guardando...";

  try {
    const myTelegramId = Number(user.id);
    const referrerId = getReferrerIdFromUrl();

    const { data: existingPlayer, error: existingError } = await sb
      .from("players")
      .select("telegram_id, referred_by")
      .eq("telegram_id", myTelegramId)
      .maybeSingle();

    if (existingError) {
      console.log("ERROR BUSCANDO JUGADOR:", existingError);
      statusEl.innerText = "❌ Error buscando jugador";
      return;
    }

    const isNewPlayer = !existingPlayer;

    let referredByValue = null;

    if (isNewPlayer) {
      if (referrerId && referrerId !== myTelegramId) {
        referredByValue = referrerId;
      }
    } else {
      referredByValue = existingPlayer?.referred_by ?? null;
    }

    const { error: upsertError } = await sb
      .from("players")
      .upsert(
        {
          telegram_id: myTelegramId,
          name: user.first_name || "Jugador",
          referred_by: referredByValue
        },
        {
          onConflict: "telegram_id"
        }
      );

    if (upsertError) {
      console.log("ERROR SUPABASE:", upsertError);
      statusEl.innerText = "❌ Error: " + upsertError.message;
      return;
    }

    if (isNewPlayer && referredByValue) {
      const { data: existingReferral, error: checkReferralError } = await sb
        .from("referrals")
        .select("id")
        .eq("referred_id", myTelegramId)
        .maybeSingle();

      if (checkReferralError) {
        console.log("ERROR REVISANDO REFERIDO:", checkReferralError);
      } else if (!existingReferral) {
        const { error: refInsertError } = await sb
          .from("referrals")
          .insert({
            referrer_id: referredByValue,
            referred_id: myTelegramId
          });

        if (refInsertError) {
          console.log("ERROR GUARDANDO REFERIDO:", refInsertError);
        }
      }
    }

    await grantReferralRewards(myTelegramId);

    statusEl.innerText = "✅ Preregistro completado";

    btn.innerText = "✅ Ya estás preregistrado";
    btn.disabled = true;

    await loadCount();
    await loadMyReferralInfo();
    await loadMyItems();
  } catch (err) {
    console.log("ERROR GENERAL:", err);
    statusEl.innerText = "❌ Error inesperado";
  }
}

async function grantReferralRewards(playerId) {
  const { count, error: countError } = await sb
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", playerId);

  if (countError) {
    console.log("ERROR CONTANDO REFERIDOS:", countError);
    return;
  }

  const refCount = count ?? 0;
  const rewardsToGrant = getMilestoneRewards(refCount);

  for (const reward of rewardsToGrant) {
    const { data: existingItem, error: existingItemError } = await sb
      .from("player_items")
      .select("id")
      .eq("player_id", playerId)
      .eq("item_key", reward.item_key)
      .maybeSingle();

    if (existingItemError) {
      console.log("ERROR REVISANDO ITEM:", existingItemError);
      continue;
    }

    if (!existingItem) {
      const { error: insertItemError } = await sb
        .from("player_items")
        .insert({
          player_id: playerId,
          item_key: reward.item_key,
          quantity: reward.quantity
        });

      if (insertItemError) {
        console.log("ERROR ENTREGANDO RECOMPENSA:", insertItemError);
      }
    }
  }
}

async function loadCount() {
  const { count, error } = await sb
    .from("players")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.log("ERROR CONTADOR:", error);
    return;
  }

  countEl.innerText = count ?? 0;
}

async function loadMyReferralInfo() {
  const user = getTelegramUser();

  if (!user) {
    myRefCountEl.innerText = "0";
    refLinkEl.innerText = "";
    nextRewardEl.innerText = "";
    debugRefEl.innerText = "";
    return;
  }

  const myTelegramId = Number(user.id);
  const referrerId = getReferrerIdFromUrl();

  debugRefEl.innerText = `Mi ID: ${myTelegramId} | Ref recibido: ${referrerId ?? "ninguno"}`;

  refLinkEl.innerText = getReferralLink(myTelegramId);

  const { count, error } = await sb
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", myTelegramId);

  if (error) {
    console.log("ERROR MIS REFERIDOS:", error);
    return;
  }

  const refCount = count ?? 0;

  myRefCountEl.innerText = refCount;
  nextRewardEl.innerText = getNextReward(refCount);
}


async function loadMyItems() {
  const user = getTelegramUser();

  if (!user) {
    myItemsEl.innerHTML = "";
    return;
  }

  const myTelegramId = Number(user.id);

  const { data, error } = await sb
    .from("player_items")
    .select("item_key, quantity")
    .eq("player_id", myTelegramId)
    .order("id", { ascending: true });

  if (error) {
    console.log("ERROR CARGANDO ITEMS:", error);
    return;
  }

  if (!data || data.length === 0) {
    myItemsEl.innerHTML = "<p>Aún no has desbloqueado recompensas.</p>";
    return;
  }

  myItemsEl.innerHTML = data
    .map(item => `<div class="reward-card">${getItemLabel(item.item_key)}</div>`)
    .join("");
}

async function copyReferralLink() {
  const user = getTelegramUser();

  if (!user) {
    statusEl.innerText = "❌ Abre esta app desde Telegram";
    return;
  }

  const link = getReferralLink(Number(user.id));

  try {
    await navigator.clipboard.writeText(link);
    statusEl.innerText = "✅ Link copiado";
  } catch (err) {
    console.log("ERROR COPIANDO LINK:", err);
    statusEl.innerText = "❌ No se pudo copiar el link";
  }
}

async function init() {
  const user = getTelegramUser();

  await loadCount();
  await loadMyReferralInfo();
  await loadMyItems();

  if (!user) return;

  const myTelegramId = Number(user.id);

  const { data, error } = await sb
    .from("players")
    .select("telegram_id")
    .eq("telegram_id", myTelegramId)
    .maybeSingle();

  if (!error && data) {
    btn.innerText = "✅ Ya estás preregistrado";
    btn.disabled = true;
  }

  await grantReferralRewards(myTelegramId);
  await loadMyItems();
}

init();