/**
 * Rossie — kant-en-klare video-antwoorden.
 *
 * Elke video begint met hetzelfde beeld als de idle-loop, zodat de wissel naadloos is.
 * Bestanden staan in /public/rossie/video/.
 *
 * `tekst` komt als chatbericht van Rossie in het gesprek, zodat het gesprek
 * ook leesbaar is met het geluid uit.
 */
export const IDLE_VIDEO = "/rossie/video/rossie-idle.mp4";

export const VIDEO_ANTWOORDEN = {
  wie: {
    src: "/rossie/video/rossie-wie-ben-jij.mp4",
    tekst: "Ik ben Rossie, de mascotte van FC Twente! Waar je ook woont, ik hou je op de hoogte van alles rond de club. Vraag maar raak!",
  },
  wanneer: {
    src: "/rossie/video/rossie-wanneer-speelt-twente.mp4",
    tekst: "Zaterdag 10 oktober om acht uur 's avonds, uit bij Fortuna Sittard! En op donderdag 15 oktober spelen we thuis in de Conference League tegen Thun.",
  },
  weigering: {
    src: "/rossie/video/rossie-weigering.mp4",
    tekst: "Sorry, daar kan ik je niet mee helpen. Over transfers en zulke zaken zeg ik niks. Maar vraag me gerust iets over de wedstrijd of de app!",
  },
};

/**
 * Trefwoorden per video. Volgorde telt: de weigering staat bovenaan,
 * zodat "wanneer komt de nieuwe spits?" nooit de programma-video krijgt.
 * Geen losse woorden als "jij" of clubnamen: die zijn te breed en
 * horen bij de live chat met het veiligheidsfilter.
 * Spaties om een woord = alleen als heel woord: " geld " past niet op "geldig".
 */
const REGELS = [
  {
    video: "weigering",
    woorden: ["transfer", "nieuwe spits", "nieuwe speler", "aankoop", "verkoop", "vertrekt", "blessure", "geblesseerd", "salaris", "verdient", "contract", " geld ", "politiek"],
  },
  {
    video: "wanneer",
    woorden: ["wanneer speelt", "wanneer spelen", "volgende wedstrijd", "volgende duel", "programma", "hoe laat is de aftrap", "wanneer is de aftrap", "tegen wie spelen"],
  },
  {
    video: "wie",
    woorden: ["wie ben jij", "wie ben je", "wie is rossie", "wat ben jij", "stel je voor", "stel jezelf voor"],
  },
];

/** Accenten en leestekens weg, alles klein: "Wíe bén jij?!" wordt "wie ben jij". */
function normaliseer(tekst) {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Geeft de sleutel van de passende video terug, of null als de live chat het moet doen. */
export function koppelVraag(vraag) {
  // spatie ervoor en erachter, zodat " geld " ook aan het begin/eind van de vraag past
  const q = ` ${normaliseer(vraag)} `;
  for (const regel of REGELS) {
    if (regel.woorden.some((w) => q.includes(w))) return regel.video;
  }
  return null;
}
