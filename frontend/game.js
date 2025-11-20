const API_BASE = "http://localhost:3000/game";

let gameId = null;
let playerId = null;
let pollInterval = null;

// Elements del DOM
const statusText = document.getElementById("statusText");
const gameInfo = document.getElementById("gameInfo");
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const btnPlay = document.getElementById("btnPlay");

// --- ELEMENTOS NUEVOS ---
const inlinePlay = document.getElementById("inlinePlay");
const goalBox = document.getElementById("goalBox");
const pitchImage = document.getElementById("pitchImage");
const closeInlinePlay = document.getElementById("closeInlinePlay");
const inlineModeLabel = document.getElementById("inlineModeLabel");

// Modal
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

// Helpers modal
function openModal(title, innerHtml) {
    modalTitle.textContent = title;
    modalBody.innerHTML = innerHtml;
    modalOverlay.classList.remove("hidden");
}

function closeModal() {
    modalOverlay.classList.add("hidden");
}

modalClose.addEventListener("click", () => {
    closeModal();
});

// Crear partida
btnCreate.addEventListener("click", async () => {
    try {
        const res = await fetch(`${API_BASE}/create`, { method: "POST" });
        const data = await res.json();

        gameId = data.gameId;

        statusText.textContent = "Partida creada. Ara uneix-te a la partida.";
        gameInfo.textContent = `Codi de partida: ${gameId}`;

        btnPlay.disabled = true; // Encara no pot jugar fins unir-se
    } catch (err) {
        console.error(err);
        alert("Error creant partida");
    }
});

// Unir-se a partida
btnJoin.addEventListener("click", () => {
    openModal(
        "Unir-me a una partida",
        `
    <label for="joinGameId">Introdueix el codi de partida:</label>
    <input id="joinGameId" type="text" style="width:100%;padding:0.4rem;border-radius:8px;border:1px solid #4b5563;background:#020617;color:#f9fafb;margin-bottom:0.75rem;">
    <button id="joinConfirm">Unir-me</button>
  `
    );

    document.getElementById("joinConfirm").addEventListener("click", async () => {
        const input = document.getElementById("joinGameId");
        const id = input.value.trim();
        if (!id) return;

        try {
            const res = await fetch(`${API_BASE}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: id })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Error unint-se a la partida");
                return;
            }

            gameId = id;
            playerId = data.playerId;
            statusText.textContent = `Unió correcta a la partida. Ets ${playerId}.`;
            gameInfo.textContent = `Codi de partida: ${gameId}`;
            btnPlay.disabled = false;
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Error de connexió al servidor");
        }
    });
});

// Abrir el selector inline (modo: primero shoot, luego defend)
btnPlay.addEventListener("click", () => {
    if (!gameId || !playerId) {
        alert("Primer has de crear o unir-te a una partida.");
        return;
    }
    openInlinePlay();
});

closeInlinePlay.addEventListener("click", () => {
    closeInlinePlayMode();
});

function openInlinePlay() {
    inlinePlay.classList.remove("hidden");
    inlinePlay.classList.add("visible");
    inlinePlay.setAttribute("aria-hidden", "false");

    inlineModeLabel.textContent = "Tria el teu xut";
    renderGoalZones("shoot");
}

function closeInlinePlayMode() {
    inlinePlay.classList.add("hidden");
    inlinePlay.classList.remove("visible");
    inlinePlay.setAttribute("aria-hidden", "true");
    goalBox.innerHTML = "";
}

// Renderiza las 9 zonas dentro de goalBox
function renderGoalZones(mode, prevShoot) {
    goalBox.innerHTML = "";

    const zones = [
        { cls: "zone-top-left", h: "alta", d: "esquerra" },
        { cls: "zone-top-center", h: "alta", d: "centre" },
        { cls: "zone-top-right", h: "alta", d: "dreta" },
        { cls: "zone-mid-left", h: "mitjana", d: "esquerra" },
        { cls: "zone-mid-center", h: "mitjana", d: "centre" },
        { cls: "zone-mid-right", h: "mitjana", d: "dreta" },
        { cls: "zone-bot-left", h: "baixa", d: "esquerra" },
        { cls: "zone-bot-center", h: "baixa", d: "centre" },
        { cls: "zone-bot-right", h: "baixa", d: "dreta" }
    ];

    zones.forEach(z => {
        const div = document.createElement("div");
        div.className = "goal-zone " + z.cls;
        div.dataset.h = z.h;
        div.dataset.d = z.d;
        goalBox.appendChild(div);

        div.addEventListener("click", async () => {
            if (mode === "shoot") {
                const shoot = { height: z.h, direction: z.d };
                inlineModeLabel.textContent = "Tria la teva parada";
                renderGoalZones("defend", shoot);
            } else if (mode === "defend") {
                const defend = { height: z.h, direction: z.d };
                const shoot = prevShoot;

                try {
                    await fetch(`${API_BASE}/play`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ gameId, playerId, shoot, defend })
                    });

                    statusText.textContent = "Jugada enviada. Esperant que el rival també jugui…";
                    closeInlinePlayMode();
                    startPollingResult();
                } catch (err) {
                    console.error(err);
                    alert("Error enviant la jugada");
                }
            }
        });
    });
}

// Polling per saber resultats
function startPollingResult() {
    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
        if (!gameId) return;
        try {
            const res = await fetch(`${API_BASE}/status?gameId=${encodeURIComponent(gameId)}`);
            const data = await res.json();

            if (data.result) {
                clearInterval(pollInterval);
                showResult(data.result);
            }
        } catch (err) {
            console.error(err);
        }
    }, 1500);
}

function showResult(result) {
    const { p1, p2, winner } = result;

    let textWinner;
    if (winner === "draw") {
        textWinner = "Empat! 🟰";
    } else if (winner === playerId) {
        textWinner = "Has guanyat! 🏆";
    } else {
        textWinner = "Has perdut… 😢";
    }

    openModal(
        "Resultat de la partida",
        `
    <p>Punts porter Jugador 1: <strong>${p1}</strong></p>
    <p>Punts porter Jugador 2: <strong>${p2}</strong></p>
    <p>${textWinner}</p>
  `
    );

    statusText.textContent = "Partida finalitzada.";
}
