// Vercel-function POST /api/rossie — de chat met Rossie (zie api/_lib/rossie.js).
// body: { bericht, geschiedenis: [{rol, tekst}], fantype, historie, mannenAnalyseOpen }
const { vraagRossie } = require("../_lib/rossie");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ fout: "alleen POST" });
  const { status, body } = await vraagRossie(req.body || {});
  res.status(status).json(body);
};
