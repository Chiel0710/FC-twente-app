// Sportdata-endpoint: de spelersselectie. Alleen GET, rechtstreeks uit de database.
// ?team=mannen|vrouwen — standaard mannen, zodat bestaande aanroepen (zoals
// Man of the Match) gewoon het eerste elftal van de mannen blijven krijgen.
const express = require("express");
const prisma = require("../lib/prisma");
const { leesTeam } = require("../lib/team");

const router = express.Router();

router.get("/", async (req, res) => {
  const team = leesTeam(req, res);
  if (!team) return;
  const players = await prisma.player.findMany({
    where: { team },
    orderBy: { rugnummer: "asc" },
  });
  res.json(players);
});

module.exports = router;
