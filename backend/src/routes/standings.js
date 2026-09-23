// Sportdata-endpoint: de stand. Alleen GET, rechtstreeks uit de database.
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  // Europese tegenstanders staan ook als Team in de database, maar horen niet
  // in de Eredivisie-stand thuis — die hebben geen position.
  const teams = await prisma.team.findMany({
    where: { position: { not: null } },
    orderBy: { position: "asc" },
  });
  res.json(teams);
});

module.exports = router;
