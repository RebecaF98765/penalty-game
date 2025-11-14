const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const gameRoutes = require("./routes/gameRoutes");
app.use("/game", gameRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log("Servidor funcionant al port " + PORT);
});
