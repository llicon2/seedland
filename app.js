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
      if (
        referrerId &&
        referrerId !== myTelegramId
      ) {
        referredByValue = referrerId;
      }
    } else {
      referredByValue = existingPlayer.referred_by ?? null;
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
      const { data: referrerData, error: referrerFetchError } = await sb
        .from("players")
        .select("referrals_count")
        .eq("telegram_id", referredByValue)
        .maybeSingle();

      if (referrerFetchError) {
        console.log("ERROR OBTENIENDO INVITADOR:", referrerFetchError);
      } else if (referrerData) {
        const currentCount = referrerData.referrals_count || 0;

        const { error: updateRefError } = await sb
          .from("players")
          .update({
            referrals_count: currentCount + 1
          })
          .eq("telegram_id", referredByValue);

        if (updateRefError) {
          console.log("ERROR ACTUALIZANDO REFERIDOS:", updateRefError);
        }
      }
    }

    statusEl.innerText = "✅ Preregistro completado";

    await loadCount();
    await loadMyReferralInfo();
  } catch (err) {
    console.log("ERROR GENERAL:", err);
    statusEl.innerText = "❌ Error inesperado";
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
    return;
  }

  const myTelegramId = Number(user.id);

  refLinkEl.innerText = getReferralLink(myTelegramId);

  const { data, error } = await sb
    .from("players")
    .select("referrals_count")
    .eq("telegram_id", myTelegramId)
    .maybeSingle();

  if (error) {
    console.log("ERROR MIS REFERIDOS:", error);
    return;
  }

  const refCount = data?.referrals_count ?? 0;

  myRefCountEl.innerText = refCount;
  nextRewardEl.innerText = getNextReward(refCount);
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
function getNextReward(refCount) {
  if (refCount < 3) return "Invita 3 amigos para ganar 🐦 Radar de Cuervos";
  if (refCount < 5) return "Invita 5 amigos para ganar 🦊 Rastreador de Zorros";
  if (refCount < 10) return "Invita 10 amigos para ganar 🛡️ Espantapájaros (12h)";
  if (refCount < 20) return "Invita 20 amigos para ganar 🐺 Espanta Zorros (12h)";
  return "🎉 Has desbloqueado todas las recompensas";
}

loadCount();
loadMyReferralInfo();