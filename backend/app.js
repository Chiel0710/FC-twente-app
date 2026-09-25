// Express-app zonder app.listen(), zodat deze in fase 2 ook als
// Vercel-function geëxporteerd kan worden.
const express = require("express");

const matchesRoutes = require("./src/routes/matches");
const standingsRoutes = require("./src/routes/standings");
const playersRoutes = require("./src/routes/players");
const newsRoutes = require("./src/routes/news");
const predictionsRoutes = require("./src/routes/predictions");
const motmRoutes = require("./src/routes/motm");
const pollsRoutes = require("./src/routes/polls");
const quizRoutes = require("./src/routes/quiz");
const checkinsRoutes = require("./src/routes/checkins");
const stickersRoutes = require("./src/routes/stickers");
const ticketsRoutes = require("./src/routes/tickets");
const profilesRoutes = require("./src/routes/profiles");
const { fanshop: fanshopRoutes } = require("./src/routes/fanshop.routes");
const { demo: demoRoutes } = require("./src/routes/demo.routes");
const { demoModus: demoModusRoutes } = require("./src/routes/demoModus.routes");
const { rossie: rossieRoutes } = require("./src/routes/rossie.routes");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// matchesRoutes bevat zelf de volledige paden (/matches, /results, /recap/latest)
app.use("/api", matchesRoutes);
app.use("/api/standings", standingsRoutes);
app.use("/api/players", playersRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/predictions", predictionsRoutes);
app.use("/api/motm", motmRoutes);
app.use("/api/polls", pollsRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/checkins", checkinsRoutes);
app.use("/api/stickers", stickersRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/fanshop", fanshopRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/demo", demoModusRoutes); // aan/uit naast de regisseur: /api/demo/modus
app.use("/api/rossie", rossieRoutes);

module.exports = app;
