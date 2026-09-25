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
const speelschemaVrouwen = require("./data/speelschema-vrouwen.json");
const standData = require("./data/stand.json");
const standVrouwen = require("./data/stand-vrouwen.json");
const wedstrijdDetails = require("./data/wedstrijd-details.json");
const selectie = require("./data/selectie.json");
const selectieVrouwen = require("./data/selectie-vrouwen.json");
// De persona's uit het profielmenu van de app (één bron: de frontend)
const voorbeeld = require("../../frontend/src/data/voorbeeld-seizoenskaart.json");

const prisma = new PrismaClient();

function dagenGeleden(dagen) {
  const d = new Date();
  d.setDate(d.getDate() - dagen);
  return d;
}

// Naam (zoals in de JSON-bestanden) → bestandsnaam van het logo in
// frontend/public/logos/. Ook clubs die niet in de Eredivisie-stand van de
// mannen staan (Europese tegenstanders, De Graafschap bij de vrouwen) staan
// hierin, want die hebben ook een logo.
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
  "De Graafschap": "de-graafschap",
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
  "De Graafschap": "DGR",
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
  await prisma.standRij.deleteMany();
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

  // Clubs uit de speelschema's of de vrouwenstand die niet in de Eredivisie-
  // stand van de mannen staan (Europese tegenstanders, De Graafschap) krijgen
  // een Team-rij zonder standcijfers.
  const alleWedstrijden = [...speelschema.wedstrijden, ...speelschemaVrouwen.wedstrijden];
  const overigeNamen = new Set(
    alleWedstrijden
      .flatMap((w) => [w.thuis, w.uit])
      .concat(standVrouwen.stand.map((rij) => rij.club))
      .filter((naam) => !teamPerNaam.has(naam)),
  );
  for (const naam of overigeNamen) {
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

  // Standen van beide competities in StandRij. Dezelfde club (Ajax, PSV...)
  // staat in beide standen, daarom per team een eigen rij.
  console.log("Standen seeden (Eredivisie + Vrouwen Eredivisie)...");
  const standen = [
    { team: "mannen", rijen: standData.stand },
    { team: "vrouwen", rijen: standVrouwen.stand },
  ];
  for (const { team, rijen } of standen) {
    for (const rij of rijen) {
      await prisma.standRij.create({
        data: {
          team,
          clubId: teamPerNaam.get(rij.club).id,
          positie: rij.positie,
          gespeeld: rij.gespeeld,
          doelsaldo: rij.doelsaldo,
          punten: rij.punten,
          zone: rij.zone,
          // alleen de vrouwenstand levert deze aan; anders null
          gewonnen: rij.gewonnen ?? null,
          gelijk: rij.gelijk ?? null,
          verloren: rij.verloren ?? null,
          doelpuntenVoor: rij.doelpuntenVoor ?? null,
          doelpuntenTegen: rij.doelpuntenTegen ?? null,
        },
      });
    }
  }

  // Beide selecties hebben dezelfde velden (rugnummer, naam, positie, foto);
  // alleen het team verschilt.
  console.log("Echte selecties seeden (mannen + vrouwen)...");
  const ontbrekendePositie = [];
  const ontbrekendeFoto = [];
  const selecties = [
    { team: "mannen", spelers: selectie.selectie },
    { team: "vrouwen", spelers: selectieVrouwen.selectie },
  ];
  for (const { team, spelers } of selecties) {
    for (const s of spelers) {
      await prisma.player.create({
        data: {
          team,
          naam: s.naam,
          rugnummer: s.rugnummer,
          positie: s.positie, // null = nog niet ingevuld in de bron
          foto: s.foto, // null = foto ontbreekt nog in de bron
        },
      });
      if (!s.positie) ontbrekendePositie.push(`${s.naam} (${team})`);
      if (!s.foto) ontbrekendeFoto.push(`${s.naam} (${team})`);
    }
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

  // Beide speelschema's in één lijst; elke wedstrijd krijgt zijn team mee
  console.log("Echte wedstrijden uit de speelschema's seeden (mannen + vrouwen)...");
  const wedstrijden = [
    ...speelschema.wedstrijden.map((w) => ({ ...w, team: "mannen" })),
    ...speelschemaVrouwen.wedstrijden.map((w) => ({ ...w, team: "vrouwen" })),
  ];
  const speelrondeTeller = { mannen: 0, vrouwen: 0 };
  for (const w of wedstrijden) {
    const thuisTeam = teamPerNaam.get(w.thuis);
    const uitTeam = teamPerNaam.get(w.uit);

    const aftrapBekend = Boolean(w.aftrap);
    const [uur, minuut] = (w.aftrap ?? "15:00").split(":").map(Number);
    const kickoff = new Date(w.datum);
    kickoff.setHours(uur, minuut, 0, 0);

    // Speelronde per team tellen, voor "Eredivisie" én "Vrouwen Eredivisie"
    // (niet voor Conference League of Supercup)
    let matchday = null;
    if (w.competitie.endsWith("Eredivisie")) {
      speelrondeTeller[w.team] += 1;
      matchday = speelrondeTeller[w.team];
    }

    let thuisScore = null;
    let uitScore = null;
    if (w.status === "gespeeld" && w.uitslag) {
      const [t, u] = w.uitslag.split("-").map(Number);
      thuisScore = t;
      uitScore = u;
    }

    // wedstrijd-details.json gaat alleen over de mannen; koppelen op datum mag
    // dus niet bij de vrouwen (die kunnen op dezelfde dag spelen)
    const details = w.team === "mannen" ? detailsPerDatum.get(w.datum) : undefined;

    const match = await prisma.match.create({
      data: {
        team: w.team,
        competition: w.competitie,
        competitieLogo: w.competitieLogo ?? null, // null = geen logo aangeleverd (bv. Supercup)
        matchday,
        kickoff,
        aftrapBekend,
        dagDefinitief: w.dagDefinitief !== false,
        // Het vrouwenschema noemt geen stadion: dan null, niet raden
        venue:
          w.team === "vrouwen"
            ? null
            : w.thuis === "FC Twente"
              ? "De Grolsch Veste, Enschede"
              : `Uitstadion ${thuisTeam.name}`,
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
        ontbrekendeDoelpunten.push(`${w.thuis} - ${w.uit} (${w.datum}, ${w.team})`);
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
      // Persona's uit het profielmenu: elke persona hoort bij profiel demo-<id>
      {
        id: "demo-bezoeker",
        naam: "Bezoeker",
        fantype: "standaard",
      },
      {
        id: "demo-johan",
        naam: "Johan de Heer",
        fantype: "seizoenskaarthouder",
        bezoekfrequentie: "seizoenskaart",
        woonregio: "Twente",
        volgtVia: "live",
      },
      {
        id: "demo-daan",
        naam: "Daan Oude Luttikhuis",
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

  // Voorbeeld-seizoenskaart (Johan de Heer) uit voorbeeld-seizoenskaart.json:
  // de bezoeker ziet die op Tickets, met de QR van dit profiel
  const kaart = voorbeeld.seizoenskaart;
  await prisma.seasonTicket.create({
    data: {
      profileId: voorbeeld.profielId,
      vak: kaart.vak,
      rij: kaart.rij,
      stoel: kaart.stoel,
      qrData: `FCT-DEMO-SEASON-${kaart.vak}-${kaart.rij}-${kaart.stoel}`,
      geldigVan: new Date("2026-08-01"),
      geldigTot: new Date("2027-06-30"),
    },
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
