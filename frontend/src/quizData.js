// Statische weekquiz — 3 weetjes, met uitleg per antwoord. Geen score/ranglijst
// (Fan-tab is voor de lol), het gedrag wordt alleen gelogd (op dit apparaat, zie api.js).
export const QUIZVRAGEN = [
  {
    id: 1,
    vraag: 'In welk jaar werd FC Twente opgericht?',
    opties: ['1954', '1965', '1972'],
    correcteIndex: 1,
    uitleg: 'FC Twente werd opgericht in 1965 — dat jaartal staat ook op het clubwapen.',
  },
  {
    id: 2,
    vraag: 'Hoe heet het stadion van FC Twente?',
    opties: ['De Kuip', 'De Grolsch Veste', 'Philips Stadion'],
    correcteIndex: 1,
    uitleg: 'FC Twente speelt haar thuiswedstrijden in De Grolsch Veste in Enschede.',
  },
  {
    id: 3,
    vraag: 'Welk dier staat afgebeeld op het clubwapen?',
    opties: ['Een leeuw', 'Een paard', 'Een adelaar'],
    correcteIndex: 1,
    uitleg: 'Het wapen toont een steigerend paard met een vlammende staart.',
  },
]
