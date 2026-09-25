// Profielen: alleen wat nodig is voor de demo-profielwissel in "Jij" (Meer-tab)
// en de teamkeuze (mannen/vrouwen) die de app onthoudt.
// Geen persoonlijke/gevoelige velden — alleen naam, fantype en teamKeuze.
const express = require("express");
const prisma = require("../lib/prisma");
const { TEAMS } = require("../lib/team");

const router = express.Router();

const VELDEN = { id: true, naam: true, fantype: true, teamKeuze: true };

// GET /api/profiles — alle (demo-)profielen, voor de profielwissel
router.get("/", async (req, res) => {
  const profiles = await prisma.profile.findMany({
    select: VELDEN,
    orderBy: { createdAt: "asc" },
  });
  res.json(profiles);
});

// PATCH /api/profiles/:id — body { teamKeuze: "mannen" | "vrouwen" }
router.patch("/:id", async (req, res) => {
  const { teamKeuze } = req.body || {};
  if (!TEAMS.includes(teamKeuze)) {
    return res.status(400).json({ fout: "teamKeuze moet mannen of vrouwen zijn" });
  }
  try {
    const profiel = await prisma.profile.update({
      where: { id: req.params.id },
      data: { teamKeuze },
      select: VELDEN,
    });
    res.json(profiel);
  } catch {
    res.status(404).json({ fout: "profiel niet gevonden" });
  }
});

module.exports = router;
