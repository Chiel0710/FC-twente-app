// Digitaal plakboek: stickers per profiel + het claimen ervan.
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// Wedstrijd + teams — genoeg voor de frontend om het sticker-object te bouwen
// (tegenstander, logoSlug, thuis/uit, datum, uitslag).
const MATCH_MET_TEAMS = {
  thuisTeam: true,
  uitTeam: true,
};

// GET /api/stickers/:profileId — alle stickers van dit profiel
router.get("/:profileId", async (req, res) => {
  const stickers = await prisma.stickerCard.findMany({
    where: { profileId: req.params.profileId },
    include: { match: { include: MATCH_MET_TEAMS } },
    orderBy: { match: { kickoff: "asc" } },
  });
  res.json(stickers);
});

// GET /api/stickers/:profileId/claimbaar — nog niet geclaimde stickers
router.get("/:profileId/claimbaar", async (req, res) => {
  const stickers = await prisma.stickerCard.findMany({
    where: { profileId: req.params.profileId, claimedAt: null },
    include: { match: { include: MATCH_MET_TEAMS } },
    orderBy: { match: { kickoff: "asc" } },
  });
  res.json(stickers);
});

// POST /api/stickers/:id/claim — zet claimedAt en kent het volgnummer toe.
// Het volgnummer is de volgorde van claimen binnen dezelfde wedstrijd, over
// alle profielen heen — bepaald door de server, nooit door de client.
router.post("/:id/claim", async (req, res) => {
  const { id } = req.params;

  const resultaat = await prisma.$transaction(async (tx) => {
    const sticker = await tx.stickerCard.findUnique({
      where: { id },
      include: { match: { include: MATCH_MET_TEAMS } },
    });
    if (!sticker) return null;

    // Al geclaimd? Idempotent teruggeven, niet nog een volgnummer uitdelen.
    if (sticker.claimedAt) return sticker;

    const aantalAlGeclaimd = await tx.stickerCard.count({
      where: { matchId: sticker.matchId, claimedAt: { not: null } },
    });

    return tx.stickerCard.update({
      where: { id },
      data: { claimedAt: new Date(), serialNumber: aantalAlGeclaimd + 1 },
      include: { match: { include: MATCH_MET_TEAMS } },
    });
  });

  if (!resultaat) {
    return res.status(404).json({ error: "Sticker niet gevonden" });
  }
  res.json(resultaat);
});

module.exports = router;
