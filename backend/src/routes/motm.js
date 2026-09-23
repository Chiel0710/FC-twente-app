// Fan-interactie: stemmen op de Man of the Match. Voor de lol — geen punten
// of ranglijst, alleen het collectieve resultaat in percentages.
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// POST /api/motm  { matchId, profileId, playerId }
router.post("/", async (req, res) => {
  const { matchId, profileId, playerId } = req.body;
  if (!matchId || !profileId || !playerId) {
    return res.status(400).json({ error: "matchId, profileId en playerId zijn verplicht" });
  }

  const stem = await prisma.motmVote.upsert({
    where: { matchId_profileId: { matchId, profileId } },
    update: { playerId },
    create: { matchId, profileId, playerId },
  });
  res.status(201).json(stem);
});

// GET /api/motm/:matchId?profileId=xxx
router.get("/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const { profileId } = req.query;

  const stemmen = await prisma.motmVote.findMany({
    where: { matchId },
    include: { player: true },
  });

  const totaal = stemmen.length;
  const perSpeler = new Map();
  for (const s of stemmen) {
    const bestaand = perSpeler.get(s.playerId);
    if (bestaand) {
      bestaand.aantal += 1;
    } else {
      perSpeler.set(s.playerId, { player: s.player, aantal: 1 });
    }
  }

  const resultaten = [...perSpeler.values()]
    .map((r) => ({ ...r, percentage: totaal ? Math.round((r.aantal / totaal) * 100) : 0 }))
    .sort((a, b) => b.aantal - a.aantal);

  const eigenKeuze = profileId
    ? (stemmen.find((s) => s.profileId === profileId)?.playerId ?? null)
    : null;

  res.json({ totaal, resultaten, eigenKeuze });
});

module.exports = router;
