const supabaseUrl = "https://lvtpsqoqywoxrvbqfycd.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dHBzcW9xeXdveHJ2YnFmeWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg1ODEsImV4cCI6MjA4ODkyNDU4MX0.AiHAyOS3zZrX3R1gPhp6GlXDOI5RO6eEF1lnLv0tnCU"

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

async function preregister() {

    const tg = window.Telegram.WebApp
    const user = tg.initDataUnsafe.user

    if (!user) {
        alert("Abre esto desde Telegram")
        return
    }

    const { data } = await supabase
        .from("players")
        .select("*")
        .eq("id", user.id)

    if (data.length === 0) {

        await supabase
            .from("players")
            .insert([
                {
                    id: user.id,
                    name: user.first_name
                }
            ])

        document.getElementById("status").innerText = "✅ Ya estás preregistrado!"
    }
    else {
        document.getElementById("status").innerText = "⚠️ Ya estabas preregistrado."
    }

    updateCount()
}

async function updateCount() {

    const { count } = await supabase
        .from("players")
        .select("*", { count: "exact" })

    document.getElementById("count").innerText = count
}

updateCount()