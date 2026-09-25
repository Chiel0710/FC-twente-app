// Vercel-function POST /api/rossie/stem — tekst naar spraak (ElevenLabs).
// Lukt dat niet, dan gebruikt de app de stem van de browser.
// body: { tekst }
const { maakStem } = require("../_lib/rossie");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ fout: "alleen POST" });
  const uitkomst = await maakStem(req.body?.tekst);
  if (uitkomst.audio) {
    res.setHeader("Content-Type", "audio/mpeg");
    return res.status(200).send(uitkomst.audio);
  }
  res.status(uitkomst.status).json(uitkomst.body);
};
