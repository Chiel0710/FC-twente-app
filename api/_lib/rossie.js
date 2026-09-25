/**
 * Rossie — de kern van de chat met de mascotte. Gedeeld door:
 *  - de Vercel-functions api/rossie/index.js en api/rossie/stem.js (live)
 *  - de lokale Express-backend (backend/src/routes/rossie.routes.js)
 *
 * De API-sleutels staan ALLEEN in environment variables (.env lokaal, de
 * projectinstellingen bij Vercel), nooit in de frontend of in git.
 *   GOOGLE_API_KEY         Gemini (de chat)
 *   ELEVENLABS_API_KEY     stem (optioneel; zonder: de browserstem)
 *   ELEVENLABS_VOICE_ID
 *
 * Twee beveiligingen over elkaar heen:
 *  1. de systeemprompt vertelt Rossie wat hij niet mag zeggen
 *  2. het VERBODEN-filter controleert vraag en antwoord alsnog
 *
 * Werkt de sleutel niet, is er geen, of duurt het te lang: dan een vriendelijk
 * vast antwoord (status 200) in plaats van een fout.
 */

// Context uit dezelfde JSON-bestanden als de app (require: Vercel neemt ze
// dan automatisch mee in de function)
const speelschema = require("../../frontend/src/data/sport/fc-twente-speelschema-2026-2027.json");
const speelschemaVrouwen = require("../../frontend/src/data/sport/fc-twente-vrouwen-speelschema-2026-2027.json");
const stand = require("../../frontend/src/data/sport/eredivisie-stand-2026-2027.json");
const standVrouwen = require("../../frontend/src/data/sport/vrouwen-eredivisie-stand-2026-2027.json");
const selectie = require("../../frontend/src/data/sport/selectie-fc-twente-2026-2027.json");
const selectieVrouwen = require("../../frontend/src/data/sport/selectie-fc-twente-vrouwen-2026-2027.json");
const plattegrondData = require("../../frontend/public/plattegrond/vakken.json");
const nieuwsData = require("../../frontend/public/nieuws/nieuws.json");
// Wedstrijdanalyses (eigen samenvattingen, zelfde bestanden als /analyse)
const analyseMannen = require("../../frontend/public/analyse/2026-09-20-twente-psv.json");
const analyseVrouwen = require("../../frontend/public/analyse/2026-09-19-psv-twente-vrouwen.json");

// De gratis sleutel mag per model maar 5 vragen per minuut stellen; elk model
// heeft een eigen teller. Zit het eerste vol (429) of is Google overbelast
// (503), dan proberen we het volgende. Samen ~20 vragen per minuut.
// Volgorde: snelste eerst; 3.5-flash doet er soms 14 s over, dus als laatste.
const MODELLEN = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-3.5-flash"];
// Langer dan dit wachten we niet op één model; dan het volgende proberen
const MAX_WACHT_MS = 8000;
// En nooit langer dan dit in totaal (een serverless function heeft een limiet)
const TOTAAL_MS = 20000;
const geminiUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const DRUK = "Even druk in de kleedkamer, probeer het zo nog eens!";
// Vast antwoord als de AI niet bereikbaar is (geen sleutel, fout, te traag)
const OFFLINE =
  "Hé! Ik zit even zonder verbinding met de kleedkamer. Kijk intussen bij Wedstrijden of Nieuws in de app, en vraag het me zo nog eens!";

/** Onderwerpen waar Rossie niet over gaat (spelregel 05 van de etappe). */
const VERBODEN = [
  /blessu|geblesseerd|kruisband|hamstring/i,
  /transfer|overgenomen|gekocht|verkocht|contract|zaakwaarnemer/i,
  /salaris|miljoen|transfersom|begroting|schulden/i,
  /politiek|verkiezing|kabinet/i,
  /\b(ajax|psv|feyenoord|heracles|az)\b.*\b(beter|slechter|hekel|haat)\b/i,
];
const ONTWIJK =
  "Daar ga ik niet over, hoor. Ik hou het bij de wedstrijd, het stadion en de gekkigheid eromheen. Vraag me iets anders!";

/** Plattegrond kort gemaakt: "314: bovenring, lange zijde, ingang A". */
function plattegrond() {
  return plattegrondData.vakken
    .map(
      (v) =>
        `${v.vak}: ${v.ring === "boven" ? "bovenring" : "benedenring"}, ${v.zijde === "lang" ? "lange" : "korte"} zijde, ingang ${v.ingang}`,
    )
    .join("; ");
}

/**
 * Nieuws, nieuwste eerst. Alleen berichten die niet onder de verboden
 * onderwerpen vallen: die zou het filter toch weigeren. Voor de rest
 * verwijst Rossie naar Nieuws in de app.
 */
function nieuws() {
  return nieuwsData.berichten
    .filter((b) => b.status !== "concept") // concepten zijn nog niet gepubliceerd
    .filter((b) => !VERBODEN.some((r) => r.test(`${b.titel} ${b.samenvatting}`)))
    .sort((a, b) => b.datum.localeCompare(a.datum))
    .map((b) => `${b.datum} | ${b.titel} | ${b.samenvatting} (bron: ${b.bron})`)
    .join("\n");
}

/** Wedstrijd- en selectiegegevens meegeven, zodat hij niets hoeft te verzinnen. */
function context(mannenAnalyseOpen = true) {
  // Zelfde selectie voor beide teams: laatste 5 gespeeld, eerstvolgende 3.
  // Is de pitch (Twente - PSV) nog niet voorbij, dan laten we die uitslag weg.
  const verborgen = mannenAnalyseOpen ? null : analyseMannen.datum;
  const gespeeld = (lijst) => lijst.filter((w) => w.status === "gespeeld" && w.datum !== verborgen).slice(-5);
  const komend = (lijst) => lijst.filter((w) => w.status === "gepland").slice(0, 3);
  return {
    vakken: plattegrond(),
    nieuws: nieuws(),
    gespeeld: gespeeld(speelschema.wedstrijden),
    komend: komend(speelschema.wedstrijden),
    selectie: selectie.selectie,
    top5: stand.stand.slice(0, 5),
    gespeeldVrouwen: gespeeld(speelschemaVrouwen.wedstrijden),
    komendVrouwen: komend(speelschemaVrouwen.wedstrijden),
    selectieVrouwen: selectieVrouwen.selectie,
    top5Vrouwen: standVrouwen.stand.slice(0, 5),
  };
}

/** Een analyse als korte tekst: uitslag, titel, intro, momenten en hoofdstukken. */
function analyseTekst(a) {
  const tijd = (m) => (m.minuut != null ? `${m.minuut}'` : m.periode ?? "");
  const moment = (m) =>
    `${tijd(m)} ${m.type}${m.speler ? ` ${m.speler}` : ""}${m.assist ? ` (assist ${m.assist})` : ""}${m.stand ? ` ${m.stand}` : ""}${m.tekst ? ` - ${m.tekst}` : ""}`;
  return `${a.thuis} - ${a.uit} ${a.uitslag} (${a.competitie}, ${a.datum}, ${a.stadion}): ${a.titel}.
${a.intro}
Momenten: ${a.sleutelmomenten.map(moment).join("; ")}.
${a.hoofdstukken.map((h) => `${h.kop}: ${h.tekst}`).join("\n")}
Uitgelicht: ${a.uitgelicht?.speler ?? "-"} (${a.uitgelicht?.reden ?? ""}).${a.context ? `
${a.context}` : ""}`;
}

/**
 * Wat Rossie over de analyses weet. De vrouwenanalyse altijd; de mannenanalyse
 * (Twente - PSV, de wedstrijd van de pitch) pas na het eindsignaal, anders
 * verklapt hij de uitslag. De app stuurt mee of dat al zo is.
 */
function analysesTekst(mannenAnalyseOpen) {
  const delen = [`FC Twente Vrouwen:
${analyseTekst(analyseVrouwen)}`];
  if (mannenAnalyseOpen) delen.unshift(`Mannen:
${analyseTekst(analyseMannen)}`);
  return `

WEDSTRIJDANALYSES (eigen samenvattingen; de hele analyse staat in de app onder Home, Wedstrijdanalyse)
${delen.join("\n\n")}
Vraagt iemand hoe een wedstrijd ging: vertel het kort in je eigen woorden en verwijs naar de analyse in de app.${
    mannenAnalyseOpen
      ? ""
      : "\nDe wedstrijd FC Twente - PSV van de mannen is nog niet gespeeld of nog bezig: verklap daar geen uitslag of doelpunten van."
  }`;
}

/** De systeemprompt: wie Rossie is, wat hij nooit doet en wat hij weet. */
function systeemprompt(mannenAnalyseOpen = true) {
  const c = context(mannenAnalyseOpen);
  // "9 Wout Weghorst (Aanvaller)"; zonder positie in de bron geen haakjes
  const speler = (s) => `${s.rugnummer} ${s.naam}${s.positie ? ` (${s.positie})` : ""}`;
  return `Je bent Rossie, de mascotte van FC Twente: een vrolijk wit paard in clubtenue.
Je praat met fans in de app van de club.

ZO KLINK JE
- Warm, kort en een tikje Twents. Twee tot vier zinnen, nooit meer.
- Je bent enthousiast maar niet schreeuwerig, en je maakt af en toe een grapje.
- Je spreekt de fan aan als iemand die er gewoon bij hoort, ook als die de selectie niet kent.
- Je praat als een mascotte, niet als een woordvoerder of een chatbot.

DIT DOE JE NOOIT
- Niets zeggen over blessures, transfers, geld of salarissen, politiek, of andere clubs.
- Nooit iets beloven namens FC Twente (geen kaarten, geen kortingen, geen toezeggingen).
- Geen cijfers, uitslagen of namen verzinnen: alleen wat hieronder staat.
- Weet je iets niet, zeg dat dan gewoon en stel een wedervraag.
- Toets bij twijfel: zou de club dit op zijn eigen kanaal zetten? Zo nee, zeg het niet.

WAT JE WEET
Mannen (eerste elftal):
Laatste wedstrijden: ${JSON.stringify(c.gespeeld)}
Komende wedstrijden: ${JSON.stringify(c.komend)}
Top 5 van de stand: ${JSON.stringify(c.top5)}
Selectie: ${c.selectie.map(speler).join(", ")}

FC Twente Vrouwen:
Laatste wedstrijden: ${JSON.stringify(c.gespeeldVrouwen)}
Komende wedstrijden: ${JSON.stringify(c.komendVrouwen)}
Top 5 van de stand (Vrouwen Eredivisie): ${JSON.stringify(c.top5Vrouwen)}
Selectie: ${c.selectieVrouwen.map(speler).join(", ")}

De Grolsch Veste, per vak de dichtstbijzijnde ingang (indicatie op basis van de plattegrond):
${c.vakken}
Vraagt iemand hoe hij bij een vak komt: noem de ingang, de ring (bij de bovenring: de trap op) en de zijde,
en zeg dat de bewegwijzering in het stadion leidend is en dat de route ook in de app staat onder Meer, Plattegrond.
Noem geen vakken die hier niet staan.

Laatste nieuws (eigen samenvattingen; het hele artikel staat bij de bron):
${c.nieuws}
Vraagt iemand naar het nieuws: vertel kort één of twee berichten in je eigen woorden, noem de bron,
en zeg dat alle berichten in de app staan onder Nieuws. Verzin geen ander nieuws.

Dit is een studentproject van Fontys, geen officiële app van FC Twente.`;
}

/**
 * Een vraag aan Rossie. Geeft { status, body } terug; body = { antwoord, ... }.
 * invoer: { bericht, geschiedenis: [{rol, tekst}], fantype }
 */
// Historie van de fan (van de app meegestuurd, bv. Daan) als korte tekst.
// Alleen bekende velden en korte strings: de app is geen vertrouwde bron.
function historieTekst(h) {
  if (!h || typeof h !== "object") return "";
  const kort = (v) => String(v ?? "").slice(0, 80);
  const tickets = (Array.isArray(h.tickets) ? h.tickets : []).slice(0, 5).map(
    (t) => `${kort(t.wedstrijd)} op ${kort(t.datum)} (${kort(t.team)}), vak ${kort(t.vak)}, rij ${kort(t.rij)}, stoel ${kort(t.stoel)}`,
  );
  const webshop = (Array.isArray(h.webshop) ? h.webshop : []).slice(0, 5).map((b) => `${kort(b.product)} maat ${kort(b.maat)}`);
  return `

OVER DEZE FAN (uit zijn profiel in de app; gebruik het als het past, verzin er niets bij)
Naam: ${kort(h.naam)}${h.woonplaats ? `, woont in ${kort(h.woonplaats)}` : ""}.
Eerder gekochte tickets: ${tickets.join("; ") || "geen"}.
Webshop: ${webshop.join("; ") || "niets"}. Gebruikt het meest: ${kort(h.meestGebruikt)}.
Vraagt hij naar tickets of een plek, dan mag je voorstellen om weer in de buurt van zijn vorige vak te zoeken.`;
}

async function vraagRossie({ bericht, geschiedenis = [], fantype = "standaard", historie = null, mannenAnalyseOpen = true } = {}) {
  if (!bericht?.trim()) return { status: 400, body: { fout: "bericht is leeg" } };

  // vooraf filteren: verboden onderwerp gaat niet eens naar het model
  if (VERBODEN.some((r) => r.test(bericht))) {
    return { status: 200, body: { antwoord: ONTWIJK, geweigerd: true } };
  }

  // Geen sleutel ingesteld: meteen het vaste antwoord
  if (!process.env.GOOGLE_API_KEY) {
    console.warn("[rossie] geen GOOGLE_API_KEY ingesteld");
    return { status: 200, body: { antwoord: OFFLINE, offline: true } };
  }

  try {
    const body = JSON.stringify({
      system_instruction: {
        parts: [
          {
            text:
              systeemprompt(mannenAnalyseOpen !== false) +
              (fantype === "afstand"
                ? "\n\nDeze fan komt zelden in het stadion en volgt de club van een afstand. Leg dingen kort uit en ga er niet vanuit dat hij de selectie kent."
                : "") +
              analysesTekst(mannenAnalyseOpen !== false) +
              historieTekst(historie),
          },
        ],
      },
      // Gemini kent de rollen "user" en "model"
      contents: [
        ...geschiedenis.slice(-8).map((m) => ({
          role: m.rol === "fan" ? "user" : "model",
          parts: [{ text: m.tekst }],
        })),
        { role: "user", parts: [{ text: bericht }] },
      ],
      generationConfig: {
        maxOutputTokens: 300,
        // Gemini Flash "denkt" standaard eerst na en die denktokens tellen
        // mee in de 300. Zonder dit blijft er soms geen antwoord over.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    // Modellen één voor één proberen tot er één antwoord geeft
    const einde = Date.now() + TOTAAL_MS;
    let r;
    let limietBereikt = false;
    for (const model of MODELLEN) {
      const over = einde - Date.now();
      if (over < 1000) break;
      try {
        r = await fetch(geminiUrl(model), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GOOGLE_API_KEY, // alleen hier, nooit in de frontend
          },
          body,
          signal: AbortSignal.timeout(Math.min(MAX_WACHT_MS, over)),
        });
      } catch (e) {
        if (e.name !== "TimeoutError") throw e;
        r = undefined;
        console.warn(`[rossie] ${model} te traag, volgende model proberen`);
        continue;
      }
      if (r.status !== 429 && r.status !== 503) break;
      if (r.status === 429) limietBereikt = true;
      console.warn(`[rossie] ${model} gaf ${r.status}, volgende model proberen`);
    }

    if (!r) throw new Error("alle modellen te traag");

    // Alle modellen vol: gratis limiet bereikt (te veel vragen per minuut of per dag)
    if (!r.ok && limietBereikt && (r.status === 429 || r.status === 503)) {
      console.warn("[rossie] Gemini-limiet bereikt bij alle modellen");
      return { status: 200, body: { antwoord: DRUK, druk: true } };
    }
    if (!r.ok) throw new Error(`Gemini gaf status ${r.status}: ${(await r.text()).slice(0, 200)}`);

    const antwoord = await r.json();
    // Alle tekststukken aan elkaar (gedachten niet). Geen tekst (bv. door
    // Google geblokkeerd) -> de ontwijkzin
    let tekst =
      (antwoord.candidates?.[0]?.content?.parts || [])
        .filter((p) => p.text && !p.thought)
        .map((p) => p.text)
        .join("")
        // geen markdown: het chatvenster en de stem tonen **vet** letterlijk
        .replace(/\*\*?([^*]+)\*\*?/g, "$1")
        .trim() || ONTWIJK;

    // achteraf filteren: glipte er toch iets doorheen, dan vervangen we het
    if (VERBODEN.some((re) => re.test(tekst))) {
      console.warn("[rossie] antwoord geweigerd door filter");
      tekst = ONTWIJK;
    }
    return { status: 200, body: { antwoord: tekst } };
  } catch (e) {
    console.error("[rossie] fout:", e.message);
    return { status: 200, body: { antwoord: OFFLINE, offline: true } };
  }
}

/**
 * Tekst omzetten naar spraak met ElevenLabs. Geeft { status, audio } of
 * { status, body } terug; lukt het niet, dan gebruikt de app de browserstem.
 */
async function maakStem(tekst) {
  const stemId = process.env.ELEVENLABS_VOICE_ID;
  if (!tekst || !process.env.ELEVENLABS_API_KEY || !stemId) {
    return { status: 404, body: { fout: "geen stem ingesteld" } };
  }
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${stemId}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: tekst,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.35 },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`ElevenLabs gaf status ${r.status}`);
    return { status: 200, audio: Buffer.from(await r.arrayBuffer()) };
  } catch (e) {
    console.warn("[rossie] stem mislukt, browser neemt over:", e.message);
    return { status: 502, body: { fout: "stem mislukt" } };
  }
}

module.exports = { vraagRossie, maakStem, VERBODEN };
