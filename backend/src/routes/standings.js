// Sportdata-endpoint: de stand. Alleen GET, rechtstreeks uit de database.
// ?team=mannen (Eredivisie, standaard) of ?team=vrouwen (Vrouwen Eredivisie).
// De vorm is gelijk aan vroeger (club + position/played/goalDifference/points/zone),
// zodat de frontend niet anders hoeft te lezen.
const express = require("express");
const prisma = require("../lib/prisma");
const { leesTeam } = require("../lib/team");

const router = express.Router();

router.get("/", async (req, res) => {
  const team = leesTeam(req, res);
  if (!team) return;
  const rijen = await prisma.standRij.findMany({
    where: { team },
    include: { club: true },
    orderBy: { positie: "asc" },
  });
  res.json(
    rijen.map((r) => ({
      id: r.club.id,
      name: r.club.name,
      shortName: r.club.shortName,
      logoUrl: r.club.logoUrl,
      isTwente: r.club.isTwente,
      position: r.positie,
      played: r.gespeeld,
      goalDifference: r.doelsaldo,
      points: r.punten,
      zone: r.zone,
      // alleen bij de vrouwenstand ingevuld, anders null
      gewonnen: r.gewonnen,
      gelijk: r.gelijk,
      verloren: r.verloren,
      doelpuntenVoor: r.doelpuntenVoor,
      doelpuntenTegen: r.doelpuntenTegen,
    })),
  );
});

module.exports = router;
