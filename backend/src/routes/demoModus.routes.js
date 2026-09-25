/**
 * Demo aan/uit — naast de demo-regisseur (demo.routes.js).
 *
 * De regisseur begint altijd in fase "voor", ook na een reset. Voor de app is
 * "geen demo" (toon de echte eerstvolgende wedstrijd) daardoor niet te
 * onderscheiden van "voor" (toon FC Twente – PSV van vanmiddag). Deze kleine
 * schakelaar maakt dat verschil: het regiepaneel zet hem aan bij "Voor de
 * wedstrijd" en uit bij "Reset".
 *
 * De app rekent de demo als actief wanneer deze schakelaar aan staat óf de
 * fase iets anders is dan "voor" — zo werkt starten via het logo (3x tikken)
 * of ?demo=wedstrijd ook, zonder dat die code hoeft te veranderen.
 *
 * Staat in het geheugen van de server, net als de regisseur zelf.
 */
const { Router } = require("express");

const demoModus = Router();

let actief = false;
// Telt elke reset. De app bewaart aanwezigheid en een aangeboden kaart in de
// browser; ziet hij een nieuwe teller, dan maakt hij die daar leeg. Zo werkt
// Reset ook op het grote scherm als je hem op je telefoon indrukt.
let resetTeller = 0;

/** GET /api/demo/modus */
demoModus.get("/modus", (_req, res) => {
  res.json({ actief, resetTeller });
});

/** POST /api/demo/modus/reset — demo uit en resetteller omhoog */
demoModus.post("/modus/reset", (_req, res) => {
  actief = false;
  resetTeller += 1;
  res.json({ actief, resetTeller });
});

/** POST /api/demo/modus — body { actief: true | false } */
demoModus.post("/modus", (req, res) => {
  const nieuw = req.body?.actief;
  if (typeof nieuw !== "boolean") {
    return res.status(400).json({ fout: "actief moet true of false zijn" });
  }
  actief = nieuw;
  res.json({ actief, resetTeller });
});

// Voor de pitch-herstart in demo.routes.js: elke app ruimt dan zijn browserdata op
function verhoogResetTeller() {
  resetTeller += 1;
}

module.exports = { demoModus, verhoogResetTeller };
