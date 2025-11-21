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

// --- Overlay per imatges ---
const imageOverlay = document.createElement("div");
imageOverlay.id = "imageOverlay";
imageOverlay.style.position = "absolute";
imageOverlay.style.inset = "0";
imageOverlay.style.pointerEvents = "none";
goalBox.appendChild(imageOverlay);

// Modal helpers
function openModal(title, innerHtml) {
    modalTitle.textContent = title;
    modalBody.innerHTML = innerHtml;
    modalOverlay.classList.remove("hidden");
}

function closeModal() {
    modalOverlay.classList.add("hidden");
}

modalClose.addEventListener("click", () => closeModal());

// Funció per copiar text (llegeix i escriu al portapapers)
function copyGameId(id) {
    // Utilitzem la Clipboard API, que és asíncrona i moderna
    navigator.clipboard.writeText(id).then(() => {
        // 🟢 CANVI CLAU: Substituïm l'alert per un missatge a la consola
        console.log(`Codi de partida copiat amb èxit: ${id}`); 
        
        // OPCIONAL: Pots afegir una petita notificació visual (tipus toast) 
        // si vols donar feedback a l'usuari sense utilitzar un alert.
        
    }).catch(err => {
        // En cas d'error (per exemple, si el navegador bloqueja la Clipboard API)
        console.error('Error copiant el text:', err);
        alert(`La còpia automàtica ha fallat. Copia manualment: ${id}`); 
    });
}


// Crear partida
btnCreate.addEventListener("click", async () => {
    try {
        const res = await fetch(`${API_BASE}/create`, { method: "POST" });
        const data = await res.json();
        const newGameId = data.gameId;
        gameId = newGameId;
        
        statusText.textContent = "Partida creada. Ara uneix-te a la partida.";
        
        // 🟢 Codi de partida + Botó de Còpia
        gameInfo.innerHTML = `
            Codi de partida: <strong>${newGameId}</strong> 
            <button id="copyBtn" class="small">📋 Copiar</button>
        `;
        btnPlay.disabled = true;

        // Afegim l'esdeveniment de clic al nou botó
        document.getElementById('copyBtn').addEventListener('click', () => {
            copyGameId(newGameId);
        });

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
    <input id="joinGameId" type="text" 
    style="
        width:100%;
        padding:0.6rem 0.8rem;
        border-radius:8px;
        border:1px solid #94a3b8;
        background:#ffffff; 
        color:#0f172a;
        margin-bottom:1rem;
        font-size: 1rem;
    ">
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
            
            // 🟢 Codi de partida + Botó de Còpia
            gameInfo.innerHTML = `
                Codi de partida: <strong>${gameId}</strong> 
                <button id="copyBtn" class="small">📋 Copiar</button>
            `;
            
            // Afegim l'esdeveniment de clic al nou botó
            document.getElementById('copyBtn').addEventListener('click', () => {
                copyGameId(gameId);
            });
            
            btnPlay.disabled = false;
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Error de connexió al servidor");
        }
    });
});

// Obrir selector inline
btnPlay.addEventListener("click", () => {
    if (!gameId || !playerId) {
        alert("Primer has de crear o unir-te a una partida.");
        return;
    }
    openInlinePlay();
});

closeInlinePlay.addEventListener("click", () => closeInlinePlayMode());

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
    goalBox.querySelectorAll(".goal-zone")?.forEach(z => z.remove());
    imageOverlay.innerHTML = ""; // neteja imatges
}

// Funció per afegir imatge amb offset
function addImageToOverlay(src, x, y, offsetX = 0, offsetY = 0) {
    const img = document.createElement("img");
    img.src = src;
    img.style.position = "absolute";
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.left = `${x - 20 + offsetX}px`;
    img.style.top = `${y - 20 + offsetY}px`;
    img.style.pointerEvents = "none";
    imageOverlay.appendChild(img);
}

// Render zones
function renderGoalZones(mode, prevShoot) {
    goalBox.querySelectorAll(".goal-zone")?.forEach(z => z.remove());

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
            const rect = div.getBoundingClientRect();
            const parentRect = goalBox.getBoundingClientRect();
            const x = rect.left - parentRect.left + rect.width / 2;
            const y = rect.top - parentRect.top + rect.height / 2;

            if (mode === "shoot") {
                addImageToOverlay("img/ball.png", x, y, -20, 0); // pilota
                const shoot = { height: z.h, direction: z.d };
                inlineModeLabel.textContent = "Tria la teva parada";
                renderGoalZones("defend", shoot);
            } else if (mode === "defend") {
                addImageToOverlay("img/gloves.png", x, y, 20, 0); // guants + offset
                const defend = { height: z.h, direction: z.d };
                const shoot = prevShoot;

                setTimeout(async () => {
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
                }, 1000);
            }
        });
    });
}

// Polling
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
    if (winner === "draw") textWinner = "Empat! 🟰";
    else if (winner === playerId) textWinner = "Has guanyat! 🏆";
    else textWinner = "Has perdut… 😢";

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