const express = require("express");
const router = express.Router();
const gameManager = require("../gameManager");

// Crear partida
router.post("/create", (req, res) => {
  const gameId = gameManager.createGame();
  res.json({ gameId });
});

// Unir jugador
router.post("/join", (req, res) => {
  const { gameId } = req.body;
  const playerId = gameManager.joinGame(gameId);

  if (!playerId) {
    return res.status(400).json({ error: "Partida no trobada" });
  }

  if (playerId === "full") {
    return res.status(400).json({ error: "Partida plena" });
  }

  res.json({ playerId });
});

// Guardar jugada
router.post("/play", (req, res) => {
  const { gameId, playerId, shoot, defend } = req.body;

  gameManager.saveMove(gameId, playerId, { shoot, defend });

  res.json({ status: "OK" });
});

// Estat de la partida
router.get("/status", (req, res) => {
  const game = gameManager.getStatus(req.query.gameId);

  if (!game) {
    return res.status(400).json({ error: "Partida no trobada" });
  }

  res.json(game);
});

module.exports = router;
