/**
 * Demo-regisseur — speelt FC Twente – PSV (20 sep 2026, 3-2) af in ruim twee minuten.
 *
 * Pitchverloop: de app start (op localhost) met POST /pitch -> fase "voor" met
 * een afteller van PITCH_AFTELLEN_SEC; bij 0 begint de wedstrijd vanzelf.
 *
 * Waarom geen echte livescore? Op de pitchmiddag wordt er niet gevoetbald, en een
 * betaalde live-API kan er net dan uit liggen. Dit draait altijd, en jij bepaalt
 * het moment. De gebeurtenissen komen uit data/wedstrijd-details-2026-2027.json,
 * dus het zijn de echte doelpunten en minuten.
 *
 * De stand leeft in het geheugen van de server: één demo tegelijk, iedereen die
 * de app open heeft ziet hetzelfde. Bij herstart begint hij gewoon opnieuw.
 *
 * Aangeleverd als ESM — hier omgezet naar CommonJS (require/module.exports)
 * zodat het bij de rest van deze backend past. De route-logica is ongewijzigd.
 */
const { Router } = require("express");
const fs = require("node:fs");
const path = require("node:path");
const prisma = require("../lib/prisma");
const { verhoogResetTeller } = require("./demoModus.routes");

const demo = Router();

// ---- Snelheid van de pitch (instelbaar) ----
const MATCH_ID = "2026-09-20";           // FC Twente – PSV
const PITCH_AFTELLEN_SEC = 20;           // afteller op Home tot de aftrap
const SEC_PER_MINUUT = 1.5;              // 90 speelminuten -> ~2 min 15 s
const RUST_SEC = 5;

// Na het eindsignaal volgen vanzelf nog drie meldingen (wachttijd in seconden)
const WACHT_HIGHLIGHTS = 8;              // "Twente in 60 seconden"
const WACHT_STEMMEN = 12;                // "Stem nu op de Man of the Match"
const WACHT_STICKER = 18;                // plakboek-sticker claimen

/** Fases: "voor" -> "live" -> "rust" -> "live" -> "na" -> "dagerna" */
let staat = beginStaat();

function beginStaat(aftrapOp = null) {
  // naOp = moment van het eindsignaal (ms), voor de meldingen die daarna volgen;
  // aftrapOp = moment waarop de wedstrijd vanzelf begint (pitch), of null
  return { fase: "voor", gestartOp: null, minuut: 0, thuis: 0, uit: 0, meldingen: [], gezien: false, naOp: null, aftrapOp };
}

function wedstrijd() {
  const bestand = path.join(process.cwd(), "data", "wedstrijd-details-2026-2027.json");
  const alles = JSON.parse(fs.readFileSync(bestand, "utf8"));
  const w = alles.wedstrijden.find((x) => x.id === MATCH_ID);
  if (!w) throw new Error(`Wedstrijd ${MATCH_ID} niet gevonden in wedstrijd-details.json`);
  return w;
}

/** Speelminuut op basis van de verstreken tijd, inclusief de rustpauze. */
function huidigeMinuut(verstreken) {
  const eersteHelft = 45 * SEC_PER_MINUUT;              // 157,5 s
  if (verstreken < eersteHelft) return { minuut: Math.floor(verstreken / SEC_PER_MINUUT), fase: "live" };
  if (verstreken < eersteHelft + RUST_SEC) return { minuut: 45, fase: "rust" };
  const na = verstreken - eersteHelft - RUST_SEC;
  const minuut = 45 + Math.floor(na / SEC_PER_MINUUT);
  if (minuut >= 90) return { minuut: 90, fase: "na" };
  return { minuut, fase: "live" };
}

/** Berekent de stand opnieuw uit de echte doelpunten tot en met deze minuut. */
function standTot(w, minuut) {
  let thuis = 0, uit = 0;
  const gebeurd = [];
  for (const d of w.doelpunten) {
    if (d.minuut > minuut) continue;
    if (d.team === w.thuis) thuis++; else uit++;
    gebeurd.push({ ...d, stand: `${thuis}-${uit}` });
  }
  return { thuis, uit, gebeurd };
}

/** POST /api/demo/start — begint de wedstrijd. */
demo.post("/start", (_req, res) => {
  staat = { ...beginStaat(), fase: "live", gestartOp: Date.now() };
  res.json({ ok: true, duurSeconden: Math.round(90 * SEC_PER_MINUUT + RUST_SEC) });
});

/** POST /api/demo/fase — direct naar een fase springen: voor | na | dagerna. */
demo.post("/fase", (req, res) => {
  const { fase } = req.body || {};
  if (!["voor", "na", "dagerna"].includes(fase)) {
    return res.status(400).json({ fout: "fase moet voor, na of dagerna zijn" });
  }
  const w = wedstrijd();
  if (fase === "voor") staat = beginStaat();
  else if (fase === "dagerna") {
    // Tik op het logo (in elke fase): de dag erna is een gewone dag. De
    // wedstrijd is gespeeld (eindstand), de inbox blijft staan, maar er komen
    // geen nieuwe meldingen meer (naOp = null).
    const eind = standTot(w, 90);
    staat = { ...staat, fase: "dagerna", gestartOp: null, aftrapOp: null, minuut: 90,
              thuis: eind.thuis, uit: eind.uit, naOp: null };
  } else {
    const eind = standTot(w, 90);
    staat = { fase, gestartOp: null, minuut: 90, thuis: eind.thuis, uit: eind.uit,
              meldingen: [eindMelding(w)], gezien: false, naOp: Date.now() };
  }
  res.json({ ok: true, fase });
});

/**
 * Alles terug naar het begin van de pitch: fase "voor" met een afteller van
 * PITCH_AFTELLEN_SEC, geen meldingen, en de plakboek-sticker, check-in en
 * Man of the Match-stemmen van de demowedstrijd weg (voor alle profielen).
 * Aanwezigheid en dealcodes staan in de browser en worden daar opgeruimd via
 * de resetteller (demoModus.routes.js).
 */
async function pitchOpnieuw(vertragingMs = 0) {
  staat = beginStaat(Date.now() + vertragingMs + PITCH_AFTELLEN_SEC * 1000);
  verhoogResetTeller();
  try {
    const w = wedstrijd();
    const match = await prisma.match.findFirst({
      where: { team: "mannen", thuisTeam: { name: w.thuis }, uitTeam: { name: w.uit }, status: "gespeeld" },
    });
    if (match) {
      await prisma.stickerCard.deleteMany({ where: { matchId: match.id } });
      await prisma.checkIn.deleteMany({ where: { matchId: match.id } });
      await prisma.motmVote.deleteMany({ where: { matchId: match.id } });
    }
  } catch (e) {
    console.warn("[demo] sticker en stemmen terugzetten mislukt:", e.message);
  }
}

/**
 * POST /api/demo/pitch — de app start (of herlaadt) in pitchmodus.
 * body { vertragingMs }: de afteller begint pas na de splash (max. 10 s).
 */
demo.post("/pitch", async (req, res) => {
  const vertraging = Math.min(10000, Math.max(0, Number(req.body?.vertragingMs) || 0));
  await pitchOpnieuw(vertraging);
  res.json({ ok: true, aftellenSec: PITCH_AFTELLEN_SEC });
});

/** POST /api/demo/reset — zelfde als /pitch (oude naam, blijft werken) */
demo.post("/reset", async (_req, res) => {
  await pitchOpnieuw();
  res.json({ ok: true });
});

/** Melding bij het eindsignaal: naar Home (stemmen volgt als eigen melding) */
function eindMelding(w) {
  return {
    id: "eindsignaal",
    tijd: new Date().toISOString(),
    titel: "Gewonnen! FC Twente – PSV 3-2",
    link: "/",
    varianten: varianten("Het eindsignaal heeft geklonken.", "Bekijk", "/"),
  };
}

/** Zelfde tekst/knop/link voor elk fantype */
function varianten(tekst, knop, link) {
  const v = { tekst, knop, route: link };
  return { standaard: v, afstand: v };
}

// "2026-09-20" -> "/highlights/2026-09-20"; sleutel van de sticker in het plakboek
const highlightsLink = (w) => `/highlights/${w.datum}`;
const stickerLink = (w) => `/plakboek?claim=${w.datum}-twente-psv`;

/** Melding bij elk doelpunt tijdens de wedstrijd (ook bij een tegengoal) */
function goalMelding(w, d) {
  const voorTwente = d.team === "FC Twente";
  return {
    id: `goal-${d.minuut}`,
    tijd: new Date().toISOString(),
    titel: voorTwente ? `GOAL! FC Twente – PSV ${d.stand}` : `Tegengoal. FC Twente – PSV ${d.stand}`,
    link: "/",
    varianten: varianten(`${d.minuut}' ${d.speler}`, "Volg live", "/"),
  };
}

/** WACHT_HIGHLIGHTS seconden na het eindsignaal */
function highlightsMelding(w) {
  return {
    id: "highlights",
    tijd: new Date().toISOString(),
    titel: "Twente in 60 seconden",
    link: highlightsLink(w),
    varianten: varianten(`Bekijk de goals van ${w.thuis.replace("FC ", "")} – ${w.uit}`, "Bekijk", highlightsLink(w)),
  };
}

/** WACHT_STEMMEN seconden na het eindsignaal: naar het stemscherm */
function stemMelding() {
  return {
    id: "stemmen",
    tijd: new Date().toISOString(),
    titel: "Stem nu op de Man of the Match",
    link: "/fan?open=motm",
    varianten: varianten("Wie was de beste Twente-speler tegen PSV?", "Stemmen", "/fan?open=motm"),
  };
}

/**
 * WACHT_STICKER seconden na het eindsignaal. De titel hangt af van de fan;
 * aanwezigheid staat in de browser, dus de app kiest uit `titels`:
 *   erbij    — groen getikt bij "Ben je erbij?"
 *   afstand  — fantype "afstand"
 *   standaard
 */
function stickerMelding(w) {
  const titels = {
    erbij: "Was je erbij? Claim je plakboek-sticker",
    afstand: "Je keek mee op afstand. Claim je plakboek-sticker",
    standaard: `Claim je plakboek-sticker van ${w.thuis.replace("FC ", "")} – ${w.uit}`,
  };
  return {
    id: "sticker",
    tijd: new Date().toISOString(),
    titel: titels.standaard,
    titels,
    link: stickerLink(w),
    varianten: varianten(`${w.thuis.replace("FC ", "")} – ${w.uit} 3-2 staat klaar in je plakboek`, "Claim", stickerLink(w)),
  };
}

const heeftMelding = (id) => staat.meldingen.some((m) => m.id === id);

/**
 * GET /api/demo/state — de app haalt dit elke seconde op.
 * Levert de fase, de minuut, de stand, de gebeurtenissen tot nu toe
 * en eventueel de melding die net is vrijgekomen.
 */
demo.get("/state", (_req, res) => {
  const w = wedstrijd();

  // Pitch: afteller op 0 -> de wedstrijd begint vanzelf
  if (staat.fase === "voor" && staat.aftrapOp && Date.now() >= staat.aftrapOp) {
    staat = { ...staat, fase: "live", gestartOp: staat.aftrapOp };
  }

  if (staat.fase === "live" || staat.fase === "rust") {
    const verstreken = (Date.now() - staat.gestartOp) / 1000;
    const { minuut, fase } = huidigeMinuut(verstreken);
    const { thuis, uit, gebeurd } = standTot(w, minuut);
    staat = { ...staat, minuut, fase, thuis, uit };
    // een melding per doelpunt, zodra de klok die minuut passeert
    for (const d of gebeurd) {
      if (!heeftMelding(`goal-${d.minuut}`)) staat.meldingen = [...staat.meldingen, goalMelding(w, d)];
    }
    if (fase === "na" && !heeftMelding("eindsignaal")) {
      staat.meldingen = [...staat.meldingen, eindMelding(w)];
      staat.naOp = Date.now();
    }
  }

  // Na het eindsignaal: highlights, stemmen en sticker, elk na hun eigen
  // wachttijd. Alleen in fase "na": de dag erna komen er geen meldingen meer.
  if (staat.fase === "na" && staat.naOp) {
    const sindsEinde = (Date.now() - staat.naOp) / 1000;
    if (sindsEinde >= WACHT_HIGHLIGHTS && !heeftMelding("highlights")) {
      staat.meldingen = [...staat.meldingen, highlightsMelding(w)];
    }
    if (sindsEinde >= WACHT_STEMMEN && !heeftMelding("stemmen")) {
      staat.meldingen = [...staat.meldingen, stemMelding()];
    }
    if (sindsEinde >= WACHT_STICKER && !heeftMelding("sticker")) {
      staat.meldingen = [...staat.meldingen, stickerMelding(w)];
    }
  }

  const { gebeurd } = standTot(w, staat.minuut);
  res.json({
    fase: staat.fase,                  // voor | live | rust | na | dagerna
    // ms tot de aftrap (alleen bij de pitch-afteller); de app telt zelf verder
    restMs: staat.fase === "voor" && staat.aftrapOp ? Math.max(0, staat.aftrapOp - Date.now()) : null,
    minuut: staat.minuut,
    wedstrijd: { thuis: w.thuis, uit: w.uit, datum: w.datum, uitzending: "ESPN 1" },
    stand: { thuis: staat.thuis, uit: staat.uit },
    gebeurtenissen: gebeurd,           // doelpunten tot nu toe, met minuut en stand
    meldingen: staat.meldingen,
  });
});

module.exports = { demo };
