/**
 * Rossie — lokaal (Express). De eigenlijke logica staat in
 * api/_lib/rossie.js, gedeeld met de Vercel-functions in api/rossie/, zodat
 * lokaal en live precies hetzelfde gebeurt. De sleutels komen uit
 * backend/.env (lokaal) of de Vercel-projectinstellingen (live).
 */
const { Router } = require("express");
const { vraagRossie, maakStem } = require("../../../api/_lib/rossie");

const rossie = Router();

/** POST /api/rossie — body: { bericht, geschiedenis: [{rol, tekst}], fantype } */
rossie.post("/", async (req, res) => {
  const { status, body } = await vraagRossie(req.body || {});
  res.status(status).json(body);
});

/** POST /api/rossie/stem — body: { tekst }; lukt het niet: de browserstem */
rossie.post("/stem", async (req, res) => {
  const uitkomst = await maakStem(req.body?.tekst);
  if (uitkomst.audio) {
    res.set("Content-Type", "audio/mpeg");
    return res.send(uitkomst.audio);
  }
  res.status(uitkomst.status).json(uitkomst.body);
});

module.exports = { rossie };
