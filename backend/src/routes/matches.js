// Sportdata-endpoints voor wedstrijden. Alleen GET, rechtstreeks uit de database.
// Bevat: /api/matches, /api/matches/:id, /api/results, /api/recap/latest
const express = require("express");
const prisma = require("../lib/prisma");
const { MATCH_INCLUDE } = require("../lib/matchInclude");

const router = express.Router();

// GET /api/matches?status=gepland|gespeeld
router.get("/matches", async (req, res) => {
  const { status } = req.query;
  const matches = await prisma.match.findMany({
    where: status ? { status } : undefined,
    include: MATCH_INCLUDE,
    orderBy: { kickoff: "asc" },
  });
  res.json(matches);
});

// GET /api/matches/:id
router.get("/matches/:id", async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: MATCH_INCLUDE,
  });
  if (!match) {
    return res.status(404).json({ error: "Wedstrijd niet gevonden" });
  }
  res.json(match);
});

// GET /api/results — gespeelde wedstrijden, nieuwste eerst
router.get("/results", async (req, res) => {
  const results = await prisma.match.findMany({
    where: { status: "gespeeld" },
    include: MATCH_INCLUDE,
    orderBy: { kickoff: "desc" },
  });
  res.json(results);
});

// GET /api/recap/latest — meest recente gespeelde wedstrijd + events
// (databron voor de latere AI-recap "Twente in 60 seconden")
router.get("/recap/latest", async (req, res) => {
  const latest = await prisma.match.findFirst({
    where: { status: "gespeeld" },
    include: MATCH_INCLUDE,
    orderBy: { kickoff: "desc" },
  });
  if (!latest) {
    return res.status(404).json({ error: "Nog geen gespeelde wedstrijd" });
  }
  res.json(latest);
});

module.exports = router;
