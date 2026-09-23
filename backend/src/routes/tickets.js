// Seizoenskaart: echte toegangs-QR, gegenereerd op de server (nooit alleen
// in de client). Elke aanroep levert een nieuwe QR op, over een payload met
// een tijdstempel — zo wordt een gedeelde/gescreenshotte QR na een tijdje
// waardeloos.
const express = require("express");
const QRCode = require("qrcode");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /api/tickets/seizoenskaart/:profileId/qr
router.get("/seizoenskaart/:profileId/qr", async (req, res) => {
  const seasonTicket = await prisma.seasonTicket.findUnique({
    where: { profileId: req.params.profileId },
    include: { profile: true },
  });

  if (!seasonTicket) {
    return res.status(404).json({ error: "Geen seizoenskaart gevonden voor dit profiel" });
  }

  const uitgegevenOm = new Date();
  const payload = `FCT|${seasonTicket.qrData}|${uitgegevenOm.getTime()}`;
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 320 });

  res.json({
    qr,
    kaartnummer: seasonTicket.qrData,
    naam: seasonTicket.profile.naam,
    vak: seasonTicket.vak,
    rij: seasonTicket.rij,
    stoel: seasonTicket.stoel,
    geldigTot: seasonTicket.geldigTot,
    verlooptOm: new Date(uitgegevenOm.getTime() + 60_000),
  });
});

module.exports = router;
