// Fan-interactie: de poll van de week. Voor de lol — geen punten of
// ranglijst, alleen de uitslag in percentages.
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

function metResultaten(poll, profileId) {
  const opties = JSON.parse(poll.options);
  const totaal = poll.votes.length;
  const tellingPerOptie = opties.map(
    (_, i) => poll.votes.filter((v) => v.optionIndex === i).length,
  );
  const percentages = tellingPerOptie.map((aantal) => (totaal ? Math.round((aantal / totaal) * 100) : 0));
  const eigenKeuze = profileId
    ? (poll.votes.find((v) => v.profileId === profileId)?.optionIndex ?? null)
    : null;

  return {
    id: poll.id,
    question: poll.question,
    opties,
    totaal,
    tellingPerOptie,
    percentages,
    eigenKeuze,
  };
}

// GET /api/polls — actieve poll(s), meest recente eerst
router.get("/", async (req, res) => {
  const { profileId } = req.query;
  const polls = await prisma.poll.findMany({
    where: { isActive: true },
    include: { votes: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(polls.map((p) => metResultaten(p, profileId)));
});

// GET /api/polls/:id?profileId=xxx
router.get("/:id", async (req, res) => {
  const { profileId } = req.query;
  const poll = await prisma.poll.findUnique({
    where: { id: req.params.id },
    include: { votes: true },
  });
  if (!poll) {
    return res.status(404).json({ error: "Poll niet gevonden" });
  }
  res.json(metResultaten(poll, profileId));
});

// POST /api/polls/:id/vote  { profileId, optionIndex }
router.post("/:id/vote", async (req, res) => {
  const { profileId, optionIndex } = req.body;
  const pollId = req.params.id;

  if (!profileId || typeof optionIndex !== "number") {
    return res.status(400).json({ error: "profileId en optionIndex zijn verplicht" });
  }

  const stem = await prisma.pollVote.upsert({
    where: { pollId_profileId: { pollId, profileId } },
    update: { optionIndex },
    create: { pollId, profileId, optionIndex },
  });
  res.status(201).json(stem);
});

module.exports = router;
