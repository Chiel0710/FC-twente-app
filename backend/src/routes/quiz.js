// Fan-interactie: weekquiz. Voor de lol — geen punten of ranglijst, dus dit
// endpoint logt alleen het gedrag (welke vraag, welk antwoord, goed/fout) als
// Event, voor de latere gedrag-gebaseerde personalisatie.
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// POST /api/quiz/answer  { profileId, vraagId, gekozenIndex, correct }
router.post("/answer", async (req, res) => {
  const { profileId, vraagId, gekozenIndex, correct } = req.body;
  if (!profileId || vraagId === undefined || gekozenIndex === undefined) {
    return res.status(400).json({ error: "profileId, vraagId en gekozenIndex zijn verplicht" });
  }

  const event = await prisma.event.create({
    data: {
      profileId,
      type: "quiz_answer",
      payload: JSON.stringify({ vraagId, gekozenIndex, correct: Boolean(correct) }),
    },
  });
  res.status(201).json(event);
});

module.exports = router;
