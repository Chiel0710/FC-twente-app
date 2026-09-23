// Sportdata-endpoint: nepnieuws. Alleen GET, rechtstreeks uit de database.
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const news = await prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
  });
  res.json(news);
});

module.exports = router;
