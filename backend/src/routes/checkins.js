// Check-in voor het digitale plakboek. Een check-in maakt meteen een
// ongeclaimde StickerCard aan voor die wedstrijd (claimedAt = null).
const express = require("express");
const crypto = require("crypto");
const prisma = require("../lib/prisma");

const router = express.Router();

// POST /api/checkins  { profileId, matchId, type? }
router.post("/", async (req, res) => {
  const { profileId, matchId } = req.body;
  const type = req.body.type ?? "attended";

  if (!profileId || !matchId) {
    return res.status(400).json({ error: "profileId en matchId zijn verplicht" });
  }

  // Al eerder ingecheckt voor deze wedstrijd? Geef de bestaande sticker terug
  // i.p.v. een dubbele aan te maken (profileId+matchId is uniek).
  const bestaande = await prisma.stickerCard.findUnique({
    where: { profileId_matchId: { profileId, matchId } },
  });
  if (bestaande) {
    const checkIn = await prisma.checkIn.findFirst({ where: { profileId, matchId } });
    return res.status(200).json({ checkIn, stickerCard: bestaande });
  }

  const checkIn = await prisma.checkIn.create({ data: { profileId, matchId } });
  const stickerCard = await prisma.stickerCard.create({
    data: {
      profileId,
      matchId,
      type,
      seed: crypto.randomBytes(6).toString("hex"),
    },
  });

  res.status(201).json({ checkIn, stickerCard });
});

module.exports = router;
