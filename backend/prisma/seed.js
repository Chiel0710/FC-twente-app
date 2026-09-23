// Seed-script: vult de database.
// ALLE sportdata (teams, stand, wedstrijden, doelpunten, spelers, foto's) komt
// uitsluitend uit de aangeleverde bronbestanden — er wordt hier NOOIT een
// speler, uitslag, statistiek, minuut of opstelling verzonnen. Ontbreekt een
// waarde in de bron (null of lege lijst): dan blijft hij ook hier null/leeg.
// Alleen nieuws, poll, demo-profielen en de seizoenskaart zijn fan-app-content
// en blijven fictief — dat is geen sportdata.
// Draaien met: npx prisma db seed

const { PrismaClient } = require("@prisma/client");
const speelschema = require("./data/speelschema.json");
const standData = require("./data/stand.json");
const wedstrijdDetails = require("./data/wedstrijd-details.json");
const selectie = require("./data/selectie.json");

const prisma = new PrismaClient();

function dagenGeleden(dagen) {
  const d = new Date();
  d.setDate(d.getDate() - dagen);
  return d;
}

// Naam (zoals in de JSON-bestanden) → bestandsnaam van het logo in
// frontend/public/logos/. Ook de 6 Europese tegenstanders die niet in de
// Eredivisie-stand voorkomen staan hierin, want die hebben ook een logo.
const LOGO_SLUG = {
  "AZ": "az",
  "Feyenoord": "feyenoord",
  "PSV": "psv",
  "FC Twente": "fc-twente",
  "Ajax": "ajax",
  "Fortuna Sittard": "fortuna-sittard",
  "Excelsior": "excelsior",
  "FC Groningen": "fc-groningen",
  "Go Ahead Eagles": "go-ahead-eagles",
  "sc Heerenveen": "sc-heerenveen",
  "NEC": "nec",
  "Sparta": "sparta",
  "Telstar": "telstar",
  "SC Cambuur": "sc-cambuur",
  "FC Utrecht": "fc-utrecht",
  "PEC Zwolle": "pec-zwolle",
  "ADO Den Haag": "ado-den-haag",
  "Willem II": "willem-ii",
  "FC Thun": "fc-thun",
  "Lincoln Red Imps": "lincoln-red-imps",
  "Pafos": "pafos",
  "SC Freiburg": "sc-freiburg",
  "AGF Aarhus": "agf-aarhus",
  "Kairat Almaty": "kairat-almaty",
};

const SHORT_NAME = {
  "AZ": "AZ",
  "Feyenoord": "FEY",
  "PSV": "PSV",
  "FC Twente": "TWE",
  "Ajax": "AJA",
  "Fortuna Sittard": "FOR",
  "Excelsior": "EXC",
  "FC Groningen": "GRO",
  "Go Ahead Eagles": "GAE",
  "sc Heerenveen": "HEE",
  "NEC": "NEC",
  "Sparta": "SPA",
  "Telstar": "TEL",
  "SC Cambuur": "CAM",
  "FC Utrecht": "UTR",
  "PEC Zwolle": "PEC",
  "ADO Den Haag": "ADO",
  "Willem II": "WIL",
  "FC Thun": "THU",
  "Lincoln Red Imps": "LIN",
  "Pafos": "PAF",
  "SC Freiburg": "FRE",
  "AGF Aarhus": "AGF",
  "Kairat Almaty": "KAI",
};

// -----------------------------------------------------------------------
// 5 verzonnen nieuwsitems.
// -----------------------------------------------------------------------
const NIEUWS = [
  {
    title: "Twente wint galawedstrijd in eigen huis",
    summary: "Een sterk eerste kwartier bleek doorslaggevend voor de zege van afgelopen weekend.",
    body: "In een goedgevulde Grolsch Veste toonde het elftal veel strijdlust en counterkracht. De ploeg controleerde het spel vanaf minuut één en gaf nauwelijks kansen weg.",
    imageUrl: "https://placehold.co/800x450?text=FC+Twente+Nieuws",
  },
  {
    title: "Jeugdspeler tekent eerste profcontract",
    summary: "Een talent uit de eigen opleiding zet een belangrijke stap in zijn carrière.",
    body: "Na indrukwekkende optredens bij Jong Twente heeft de club besloten een langdurig contract aan te bieden. De clubleiding spreekt van een logische vervolgstap.",
    imageUrl: "https://placehold.co/800x450?text=FC+Twente+Nieuws",
  },
  {
    title: "Voorverkoop losse kaarten volgende thuiswedstrijd gestart",
    summary: "Vanaf vandaag zijn kaarten voor de aankomende thuiswedstrijd te bestellen.",
    body: "Leden en seizoenkaarthouders krijgen zoals gebruikelijk voorrang. Voor overige supporters start de verkoop enkele dagen later.",
    imageUrl: "https://placehold.co/800x450?text=FC+Twente+Nieuws",
  },
  {
    title: "Clubicoon blikt terug op bewogen seizoensstart",
    summary: "In een uitgebreid gesprek deelt een oud-speler zijn kijk op de huidige selectie.",
    body: "Volgens hem ligt de kracht van het huidige elftal vooral in de mentaliteit en de wil om elkaar te helpen op het veld.",
    imageUrl: "https://placehold.co/800x450?text=FC+Twente+Nieuws",
  },
  {
    title: "Fanevenement in aanloop naar het weekend",
    summary: "Supporters kunnen zich aanmelden voor een ontmoeting voorafgaand aan de wedstrijd.",
    body: "Het evenement biedt fans de kans om elkaar te ontmoeten en samen op te lopen richting het stadion.",
    imageUrl: "https://placehold.co/800x450?text=FC+Twente+Nieuws",
  },
];

async function main() {
  console.log("Bestaande data opruimen...");
  await prisma.shopKlik.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.event.deleteMany();
  await prisma.seasonTicket.deleteMany();
  await prisma.motmVote.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.stickerCard.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.match.deleteMany();
  await prisma.newsItem.deleteMany();
  await prisma.player.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.team.deleteMany();

  console.log("Teams + echte Eredivisie-stand seeden...");
  const teamPerNaam = new Map();

  for (const rij of standData.stand) {
    const team = await prisma.team.create({
      data: {
        name: rij.club,
        shortName: SHORT_NAME[rij.club] ?? rij.club.slice(0, 3).toUpperCase(),
        logoUrl: `/logos/${LOGO_SLUG[rij.club]}.png`,
        isTwente: rij.club === "FC Twente",
        position: rij.positie,
        played: rij.gespeeld,
        goalDifference: rij.doelsaldo,
        points: rij.punten,
        zone: rij.zone,
      },
    });
    teamPerNaam.set(rij.club, team);
  }

  // Europese tegenstanders uit het speelschema staan niet in de Eredivisie-
  // stand — die krijgen een Team-rij zonder standcijfers.
  const europeseNamen = new Set(
    speelschema.wedstrijden
      .filter((w) => !teamPerNaam.has(w.thuis))
      .map((w) => w.thuis)
      .concat(
        speelschema.wedstrijden.filter((w) => !teamPerNaam.has(w.uit)).map((w) => w.uit),
      ),
  );
  for (const naam of europeseNamen) {
    const team = await prisma.team.create({
      data: {
        name: naam,
        shortName: SHORT_NAME[naam] ?? naam.slice(0, 3).toUpperCase(),
        logoUrl: `/logos/${LOGO_SLUG[naam]}.png`,
        isTwente: false,
      },
    });
    teamPerNaam.set(naam, team);
  }

  console.log("Echte selectie seeden (spelers.js)...");
  const ontbrekendePositie = [];
  const ontbrekendeFoto = [];
  for (const s of selectie.selectie) {
    await prisma.player.create({
      data: {
        naam: s.naam,
        rugnummer: s.rugnummer,
        positie: s.positie, // null = nog niet ingevuld in de bron
        fotoUrl: s.foto, // null = foto ontbreekt nog in de bron
      },
    });
    if (!s.positie) ontbrekendePositie.push(s.naam);
    if (!s.foto) ontbrekendeFoto.push(s.naam);
  }
  if (ontbrekendePositie.length) {
    console.log(`  Let op: positie ontbreekt in de bron voor: ${ontbrekendePositie.join(", ")}`);
  }
  if (ontbrekendeFoto.length) {
    console.log(`  Let op: foto ontbreekt in de bron voor: ${ontbrekendeFoto.join(", ")}`);
  }

  // Wedstrijd-details (doelpunten/kaarten/opstelling) staan in een los bestand,
  // gekoppeld op datum, en bevatten alleen de gespeelde wedstrijden.
  const detailsPerDatum = new Map(wedstrijdDetails.wedstrijden.map((w) => [w.datum, w]));
  const ontbrekendeDoelpunten = [];

  console.log("Echte wedstrijden uit het speelschema seeden...");
  let eredivisieTeller = 0;
  for (const w of speelschema.wedstrijden) {
    const thuisTeam = teamPerNaam.get(w.thuis);
    const uitTeam = teamPerNaam.get(w.uit);

    const aftrapBekend = Boolean(w.aftrap);
    const [uur, minuut] = (w.aftrap ?? "15:00").split(":").map(Number);
    const kickoff = new Date(w.datum);
    kickoff.setHours(uur, minuut, 0, 0);

    let matchday = null;
    if (w.competitie === "Eredivisie") {
      eredivisieTeller += 1;
      matchday = eredivisieTeller;
    }

    let thuisScore = null;
    let uitScore = null;
    if (w.status === "gespeeld" && w.uitslag) {
      const [t, u] = w.uitslag.split("-").map(Number);
      thuisScore = t;
      uitScore = u;
    }

    const details = detailsPerDatum.get(w.datum);

    const match = await prisma.match.create({
      data: {
        competition: w.competitie,
        matchday,
        kickoff,
        aftrapBekend,
        venue:
          w.thuis === "FC Twente" ? "De Grolsch Veste, Enschede" : `Uitstadion ${thuisTeam.name}`,
        status: w.status,
        thuisTeamId: thuisTeam.id,
        uitTeamId: uitTeam.id,
        thuisScore,
        uitScore,
        toeschouwers: details?.toeschouwers ?? null,
        bron: details?.bron ?? null,
        compleet: details?.compleet ?? false,
      },
    });

    if (w.status === "gespeeld") {
      if (details && details.doelpunten.length > 0) {
        for (const doelpunt of details.doelpunten) {
          const scorendTeam = teamPerNaam.get(doelpunt.team);
          await prisma.matchEvent.create({
            data: {
              matchId: match.id,
              minute: doelpunt.minuut,
              type: "goal",
              teamId: scorendTeam.id,
              playerName: doelpunt.speler,
            },
          });
        }
      } else {
        ontbrekendeDoelpunten.push(`${w.thuis} - ${w.uit} (${w.datum})`);
      }
      // Kaarten en opstelling staan in de bron nu nog altijd leeg — zodra daar
      // echte data in komt, hier op dezelfde manier als doelpunten verwerken.
    }
  }

  console.log("Nieuws seeden...");
  for (let i = 0; i < NIEUWS.length; i++) {
    await prisma.newsItem.create({
      data: { ...NIEUWS[i], publishedAt: dagenGeleden(i) },
    });
  }

  console.log("Poll seeden...");
  await prisma.poll.create({
    data: {
      question: "Wat is dit seizoen de grootste kracht van het elftal?",
      options: JSON.stringify(["De verdediging", "Het middenveld", "De aanval", "De mentaliteit"]),
      isActive: true,
    },
  });

  console.log("Demo-profielen seeden (alle fantypes)...");
  await prisma.profile.createMany({
    data: [
      {
        id: "demo-daan",
        naam: "Daan",
        fantype: "afstand",
        bezoekfrequentie: "zelden of nooit",
        woonregio: "elders in NL",
        volgtVia: "samenvatting",
        metWie: "alleen",
      },
      {
        id: "demo-hardekern",
        naam: "Bram",
        fantype: "hardekern",
        bezoekfrequentie: "elke wedstrijd",
        woonregio: "Twente",
        volgtVia: "live",
        metWie: "vrienden",
      },
      {
        id: "demo-seizoenskaart",
        naam: "Femke",
        fantype: "seizoenskaarthouder",
        bezoekfrequentie: "seizoenskaart",
        woonregio: "Twente",
        volgtVia: "live",
        metWie: "vrienden",
      },
      {
        id: "demo-gemiddeld",
        naam: "Tom",
        fantype: "gemiddeld",
        bezoekfrequentie: "paar keer per jaar",
        woonregio: "elders in NL",
        volgtVia: "samenvatting",
        metWie: "vrienden",
      },
      {
        id: "demo-losbezoek",
        naam: "Sanne",
        fantype: "losbezoek",
        bezoekfrequentie: "zelden of nooit",
        woonregio: "elders in NL",
        volgtVia: "alleen de uitslag",
        metWie: "gezin",
      },
      {
        id: "demo-gezin",
        naam: "Familie de Boer",
        fantype: "gezin",
        bezoekfrequentie: "paar keer per jaar",
        woonregio: "Twente",
        volgtVia: "live",
        metWie: "gezin",
      },
    ],
  });

  console.log("Seizoenskaart voor de seizoenskaarthouder seeden...");
  await prisma.seasonTicket.create({
    data: {
      profileId: "demo-seizoenskaart",
      vak: "F3",
      rij: "12",
      stoel: "204",
      qrData: "FCT-DEMO-SEASON-204F3",
      geldigVan: new Date("2026-08-01"),
      geldigTot: new Date("2027-06-30"),
    },
  });

  if (ontbrekendeDoelpunten.length) {
    console.log(
      `  Let op: geen doelpuntendata in de bron voor ${ontbrekendeDoelpunten.length} gespeelde wedstrijd(en): ${ontbrekendeDoelpunten.join(", ")}`,
    );
  }

  console.log("Klaar. Sportdata volledig uit de bronbestanden; nieuws/poll/profielen blijven fan-app-fictie.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
