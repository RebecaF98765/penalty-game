const games = new Map();

// Crear una nova partida
function createGame() {
  const gameId = Math.random().toString(36).substring(2, 8);

  games.set(gameId, {
    players: 0,      // comptem quants jugadors hi ha
    moves: {},
    result: null
  });

  return gameId;
}

// Unir un jugador a la partida
function joinGame(gameId) {
  const game = games.get(gameId);
  if (!game) return null;

  if (game.players >= 2) return "full";

  const playerId = game.players === 0 ? "P1" : "P2";
  game.players++;

  return playerId;
}

// Guardar la jugada d'un jugador
function saveMove(gameId, playerId, move) {
  const game = games.get(gameId);
  if (!game) return null;

  game.moves[playerId] = move;

  // Si els dos han jugat → calculem resultat
  if (game.moves.P1 && game.moves.P2) {
    game.result = calculateResult(game.moves.P1, game.moves.P2);
  }

  return true;
}

// Calcular punts
function calculatePoints(shot, defend) {
  let points = 0;
  if (shot.height === defend.height) points++;
  if (shot.direction === defend.direction) points++;
  return points;
}

// Comparar P1 vs P2
function calculateResult(move1, move2) {
  const p1 = calculatePoints(move2.shoot, move1.defend);
  const p2 = calculatePoints(move1.shoot, move2.defend);

  let winner = "draw";
  if (p1 > p2) winner = "P1";
  if (p2 > p1) winner = "P2";

  return { p1, p2, winner };
}

// Retornar estat de la partida
function getStatus(gameId) {
  return games.get(gameId) || null;
}

module.exports = {
  createGame,
  joinGame,
  saveMove,
  getStatus
};
