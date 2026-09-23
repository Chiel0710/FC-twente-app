/**
 * Fanshop — haalt de FC Twente-collectie van Castore op en serveert die
 * in ons eigen formaat. De app praat dus nooit rechtstreeks met Castore.
 *
 * Waarom via de backend?
 *  - De browser mag castore.com niet aanroepen (CORS), de server wel.
 *  - We cachen het resultaat, zodat we hun winkel niet bij elk bezoek belasten.
 *  - Valt de feed uit, dan serveren we de snapshot uit /data. De demo is dus
 *    nooit leeg, ook niet tijdens de pitch.
 *
 * Aangeleverd als ESM — hier omgezet naar CommonJS (require/module.exports)
 * zodat het bij de rest van deze backend past, en met de gedeelde
 * PrismaClient-singleton (../lib/prisma) i.p.v. een eigen `new
 * PrismaClient()`, ook dat is "hoe de rest van de backend is opgezet".
 * De route-logica zelf is verder ongewijzigd.
 */
const { Router } = require("express");
const fs = require("node:fs");
const path = require("node:path");
const prisma = require("../lib/prisma");

const fanshop = Router();

const FEED = "https://castore.com/nl-nl/collections/fc-twente/products.json?limit=250";
const COLLECTIE = "https://castore.com/nl-nl/collections/fc-twente";
const CACHE_MS = 6 * 60 * 60 * 1000; // 6 uur

let cache = { tijd: 0, data: null };

/** Shopify-product omzetten naar ons eigen, kleinere formaat. */
function zetOm(p) {
  const varianten = p.variants || [];
  const prijs = Math.min(...varianten.map((v) => parseFloat(v.price)).filter(Number.isFinite));
  return {
    id: String(p.id),
    naam: p.title,
    prijs: Number.isFinite(prijs) ? prijs : null,
    url: `https://castore.com/nl-nl/products/${p.handle}`,
    categorie: categorie(p.title),
    groep: groep(p.title),
    maten: varianten.map((v) => v.title).filter((t) => t && t !== "Default Title"),
    opVoorraad: varianten.some((v) => v.available),
  };
}

function categorie(titel) {
  const t = titel.toLowerCase();
  if (t.includes("tenue") || t.includes("kit")) return "Tenues";
  if (t.includes("sok") || t.includes("kous")) return "Sokken";
  if (t.includes("short") || t.includes("broek")) return "Broeken";
  if (t.includes("shirt") || t.includes("top")) return "Shirts";
  return "Overig";
}
function groep(titel) {
  const t = titel.toLowerCase();
  if (t.includes("junior") || t.includes("baby") || t.includes("kids")) return "Junior";
  if (t.includes("dames") || t.includes("women")) return "Dames";
  return "Heren";
}

/** Terugval: de meegeleverde snapshot. */
function snapshot() {
  const bestand = path.join(process.cwd(), "data", "fanshop-snapshot.json");
  const inhoud = JSON.parse(fs.readFileSync(bestand, "utf8"));
  return {
    producten: inhoud.producten,
    bron: "snapshot",
    bijgewerkt: inhoud.opgehaald,
    collectieUrl: COLLECTIE,
  };
}

/** GET /api/fanshop — producten, gecachet, met terugval op de snapshot. */
fanshop.get("/", async (_req, res) => {
  if (cache.data && Date.now() - cache.tijd < CACHE_MS) {
    return res.json(cache.data);
  }
  try {
    const stop = AbortSignal.timeout(6000); // niet eindeloos wachten
    const r = await fetch(FEED, { signal: stop, headers: { "User-Agent": "FC Twente fanapp (studentproject)" } });
    if (!r.ok) throw new Error(`Castore gaf status ${r.status}`);
    const json = await r.json();
    const data = {
      producten: (json.products || []).map(zetOm),
      bron: "live",
      bijgewerkt: new Date().toISOString().slice(0, 10),
      collectieUrl: COLLECTIE,
    };
    if (!data.producten.length) throw new Error("Lege feed");
    cache = { tijd: Date.now(), data };
    res.json(data);
  } catch (e) {
    console.warn("[fanshop] live feed mislukt, snapshot gebruikt:", e.message);
    res.json(snapshot());
  }
});

/**
 * POST /api/fanshop/klik — legt een doorklik vast.
 * Dit is de meetbare koppeling met de omzetpost merchandise: de adminkant
 * laat per fantype zien hoeveel fans doorklikken naar de winkel.
 * body: { profileId, productId, naam, bron }   bron = "fanshop" | "motm" | "plakboek"
 */
fanshop.post("/klik", async (req, res) => {
  const { profileId, productId, naam, bron } = req.body || {};
  if (!profileId || !productId) {
    return res.status(400).json({ fout: "profileId en productId zijn verplicht" });
  }
  try {
    await prisma.shopKlik.create({
      data: { profileId, productId, naam: naam ?? null, bron: bron ?? "fanshop" },
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error("[fanshop] klik opslaan mislukt:", e.message);
    res.status(500).json({ fout: "opslaan mislukt" });
  }
});

/** GET /api/fanshop/stats — voor de adminkant: doorklikken per bron en per product. */
fanshop.get("/stats", async (_req, res) => {
  const perBron = await prisma.shopKlik.groupBy({ by: ["bron"], _count: { _all: true } });
  const perProduct = await prisma.shopKlik.groupBy({
    by: ["naam"],
    _count: { _all: true },
    orderBy: { _count: { naam: "desc" } },
    take: 10,
  });
  res.json({ perBron, perProduct });
});

module.exports = { fanshop };
