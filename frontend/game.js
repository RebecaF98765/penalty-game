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

// Fer tirada
btnPlay.addEventListener("click", () => {
    if (!gameId || !playerId) {
        alert("Primer has de crear o unir-te a una partida.");
        return;
    }

    openModal(
        "Escull la teva tirada",
        `
    <form id="playForm">
      <h3>Xut</h3>
      <label>Alçada del xut</label>
      <select id="shootHeight">
        <option value="baixa">Baixa</option>
        <option value="mitjana">Mitjana</option>
        <option value="alta">Alta</option>
      </select>

      <label>Direcció del xut</label>
      <select id="shootDir">
        <option value="esquerra">Esquerra</option>
        <option value="centre">Centre</option>
        <option value="dreta">Dreta</option>
      </select>

      <h3>Parada</h3>
      <label>Alçada de la parada</label>
      <select id="defendHeight">
        <option value="baixa">Baixa</option>
        <option value="mitjana">Mitjana</option>
        <option value="alta">Alta</option>
      </select>

      <label>Direcció de la parada</label>
      <select id="defendDir">
        <option value="esquerra">Esquerra</option>
        <option value="centre">Centre</option>
        <option value="dreta">Dreta</option>
      </select>

      <button type="submit">Enviar jugada</button>
    </form>
  `
    );

    const form = document.getElementById("playForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const shoot = {
            height: document.getElementById("shootHeight").value,
            direction: document.getElementById("shootDir").value
        };

        const defend = {
            height: document.getElementById("defendHeight").value,
            direction: document.getElementById("defendDir").value
        };

        try {
            await fetch(`${API_BASE}/play`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId, playerId, shoot, defend })
            });

            statusText.textContent = "Jugada enviada. Esperant que el rival també jugui…";
            closeModal();

            startPollingResult();
        } catch (err) {
            console.error(err);
            alert("Error enviant la jugada");
        }
    });
});

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
