// Profielen: alleen wat nodig is voor de demo-profielwissel in "Jij" (Meer-tab).
// Geen persoonlijke/gevoelige velden — alleen naam en fantype.
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /api/profiles — alle (demo-)profielen, voor de profielwissel
router.get("/", async (req, res) => {
  const profiles = await prisma.profile.findMany({
    select: { id: true, naam: true, fantype: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(profiles);
});

module.exports = router;
