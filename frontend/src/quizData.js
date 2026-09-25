// Weekquiz (week 38): de vijf vragen uit data/demo-database.json. De goede
// antwoorden komen uit de echte data van de app:
//  - doelpunten en minuten: data/sport/wedstrijd-details-2026-2027.json
//  - de assist bij de 2-2: public/analyse/2026-09-20-twente-psv.json
//  - goals van de Vrouwen: data/sport/vrouwen-eredivisie-stand-2026-2027.json
//  - rugnummer: data/sport/selectie-fc-twente-2026-2027.json
// Wat je antwoordt telt mee in de cijfers (lib/demoDb.js → bewaarQuiz).
export const QUIZ_WEEK = 38

export const QUIZVRAGEN = [
  {
    id: 1,
    vraag: 'Wie maakte de 1-0 tegen PSV?',
    opties: ['Wout Weghorst', 'Younes Taha', 'Daouda Weidmann'],
    correcteIndex: 1,
    uitleg: 'Younes Taha schoot Twente in de 14e minuut op voorsprong.',
  },
  {
    id: 2,
    vraag: 'In welke minuut viel de winnende goal?',
    opties: ['79e minuut', '83e minuut', '88e minuut'],
    correcteIndex: 1,
    uitleg: 'Daouda Weidmann maakte in de 83e minuut de 3-2, na een rush vanaf eigen helft.',
  },
  {
    id: 3,
    vraag: 'Wie gaf de assist bij de 2-2?',
    opties: ['Daan Rots', 'Younes Taha', 'Lucas Vennegoor of Hesselink'],
    correcteIndex: 0,
    uitleg: 'Invaller Daan Rots legde met een lobje de bal klaar voor Wout Weghorst.',
  },
  {
    id: 4,
    vraag: 'Hoeveel goals maakten de Twente Vrouwen in de eerste 5 duels?',
    opties: ['14', '18', '22'],
    correcteIndex: 2,
    uitleg: 'De Vrouwen scoorden 22 keer in de eerste vijf competitieduels, en kregen er maar 3 tegen.',
  },
  {
    id: 5,
    vraag: 'Welk rugnummer draagt Ruud Nijstad?',
    opties: ['3', '4', '5'],
    correcteIndex: 1,
    uitleg: 'Verdediger Ruud Nijstad speelt met nummer 4.',
  },
]
