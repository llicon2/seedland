let users = JSON.parse(localStorage.getItem("seedland_users")) || [];

function preregister() {
    const tg = window.Telegram.WebApp;

    const user = tg.initDataUnsafe.user;

    if (!user) {
        alert("Debes abrir esto desde Telegram");
        return;
    }

    const exists = users.find(u => u.id === user.id);

    if (!exists) {
        users.push({
            id: user.id,
            name: user.first_name
        });

        localStorage.setItem("seedland_users", JSON.stringify(users));
    }

    document.getElementById("count").innerText = users.length;
}