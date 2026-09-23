// Sportdata-endpoint: de spelersselectie. Alleen GET, rechtstreeks uit de database.
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const players = await prisma.player.findMany({
    orderBy: { rugnummer: "asc" },
  });
  res.json(players);
});

module.exports = router;
