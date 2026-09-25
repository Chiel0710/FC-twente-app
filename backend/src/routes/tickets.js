// Seizoenskaart: echte toegangs-QR, gegenereerd op de server (nooit alleen
// in de client). Elke aanroep levert een nieuwe QR op, over een payload met
// een tijdstempel — zo wordt een gedeelde/gescreenshotte QR na een tijdje
// waardeloos.
const express = require("express");
const QRCode = require("qrcode");
const prisma = require("../lib/prisma");

const router = express.Router();

// QR-opties. ?transparant=1: geen witte achtergrond, zodat de QR direct op
// een gekleurd vlak kan staan (zoals op de achterkant van de seizoenskaart).
function qrOpties(req) {
  const opties = { margin: 1, width: 320 };
  if (req.query.transparant === "1") opties.color = { dark: "#000000ff", light: "#00000000" };
  return opties;
}

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
  const qr = await QRCode.toDataURL(payload, qrOpties(req));

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

// GET /api/tickets/wedstrijd/:matchId/qr?profileId=... — het kaartje voor één
// wedstrijd, op de stoel van de seizoenskaart van dit profiel. Net als de
// seizoenskaart: QR van de server, met tijdstempel, dus na een tijdje ongeldig.
router.get("/wedstrijd/:matchId/qr", async (req, res) => {
  const [match, seasonTicket] = await Promise.all([
    prisma.match.findUnique({ where: { id: req.params.matchId } }),
    prisma.seasonTicket.findUnique({
      where: { profileId: String(req.query.profileId ?? "") },
      include: { profile: true },
    }),
  ]);
  if (!match) return res.status(404).json({ error: "Wedstrijd niet gevonden" });
  if (!seasonTicket) return res.status(404).json({ error: "Geen kaart gevonden voor dit profiel" });

  const uitgegevenOm = new Date();
  const kaartnummer = `${seasonTicket.qrData}-${match.id.slice(-6).toUpperCase()}`;
  const qr = await QRCode.toDataURL(`FCT|${kaartnummer}|${uitgegevenOm.getTime()}`, qrOpties(req));

  res.json({
    qr,
    kaartnummer,
    naam: seasonTicket.profile.naam,
    vak: seasonTicket.vak,
    rij: seasonTicket.rij,
    stoel: seasonTicket.stoel,
    verlooptOm: new Date(uitgegevenOm.getTime() + 60_000),
  });
});

module.exports = router;
