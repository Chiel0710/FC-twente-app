// Fan-interactie: voorspellen wie een wedstrijd wint. Voor de lol — geen
// punten of ranglijst, alleen het collectieve sfeerbeeld in percentages.
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

const GELDIGE_KEUZES = ["thuis", "gelijk", "uit"];

// POST /api/predictions  { matchId, profileId, keuze }
router.post("/", async (req, res) => {
  const { matchId, profileId, keuze } = req.body;
  if (!matchId || !profileId || !GELDIGE_KEUZES.includes(keuze)) {
    return res
      .status(400)
      .json({ error: "matchId, profileId en een geldige keuze (thuis/gelijk/uit) zijn verplicht" });
  }

  const voorspelling = await prisma.prediction.upsert({
    where: { matchId_profileId: { matchId, profileId } },
    update: { keuze },
    create: { matchId, profileId, keuze },
  });
  res.status(201).json(voorspelling);
});

// GET /api/predictions/:matchId?profileId=xxx
router.get("/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const { profileId } = req.query;

  const voorspellingen = await prisma.prediction.findMany({ where: { matchId } });
  const totaal = voorspellingen.length;
  const telling = { thuis: 0, gelijk: 0, uit: 0 };
  for (const v of voorspellingen) telling[v.keuze] += 1;

  const percentages = Object.fromEntries(
    Object.entries(telling).map(([k, aantal]) => [k, totaal ? Math.round((aantal / totaal) * 100) : 0]),
  );
  const eigenKeuze = profileId
    ? (voorspellingen.find((v) => v.profileId === profileId)?.keuze ?? null)
    : null;

  res.json({ totaal, telling, percentages, eigenKeuze });
});

module.exports = router;
