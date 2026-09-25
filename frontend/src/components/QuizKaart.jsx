import { useState } from 'react'
import { bewaarQuiz, leesFan, useDemoDb } from '../lib/demoDb'
import { quizStats } from '../lib/demoStats'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import { QUIZVRAGEN, QUIZ_WEEK } from '../quizData'

const getal = (n) => n.toLocaleString('nl-NL')

// Weekquiz — één vraag tegelijk in een rood vlak. Direct na een antwoord zie
// je of het goed was, daarna ga je zelf door. Aan het eind je score en hoe
// iedereen het deed (startwaarden + wie er in de app meespeelde).
export default function QuizKaart() {
  useDemoDb() // opnieuw tekenen als de cijfers veranderen
  const alGespeeld = leesFan(HUIDIG_PROFIEL_ID, 'quiz')[String(QUIZ_WEEK)]
  const [index, setIndex] = useState(alGespeeld ? QUIZVRAGEN.length : 0)
  const [gekozenIndex, setGekozenIndex] = useState(null)
  const [antwoorden, setAntwoorden] = useState(alGespeeld?.antwoorden ?? [])

  const vraag = QUIZVRAGEN[index]
  const klaar = index >= QUIZVRAGEN.length

  function kies(i) {
    if (gekozenIndex !== null) return
    setGekozenIndex(i)
    setAntwoorden((a) => [...a, i === vraag.correcteIndex])
  }

  function volgende() {
    setGekozenIndex(null)
    // Laatste vraag: het resultaat bewaren (telt mee in de cijfers)
    if (index + 1 >= QUIZVRAGEN.length) bewaarQuiz(HUIDIG_PROFIEL_ID, QUIZ_WEEK, antwoorden)
    setIndex((i) => i + 1)
  }

  const stats = klaar ? quizStats() : null
  const goed = antwoorden.filter(Boolean).length

  return (
    <div className="quiz-kaart">
      <span className="eyebrow quiz-kaart__eyebrow">Weekquiz</span>

      {!klaar && (
        <>
          <p className="quiz-kaart__voortgang">
            Vraag {index + 1} van {QUIZVRAGEN.length}
          </p>
          <p className="quiz-kaart__vraag">{vraag.vraag}</p>

          <div className="quiz-kaart__opties">
            {vraag.opties.map((optie, i) => {
              let status = ''
              if (gekozenIndex !== null) {
                if (i === vraag.correcteIndex) status = 'quiz-kaart__optie--goed'
                else if (i === gekozenIndex) status = 'quiz-kaart__optie--fout'
              }
              return (
                <button
                  key={optie}
                  type="button"
                  className={`quiz-kaart__optie ${status}`}
                  onClick={() => kies(i)}
                  disabled={gekozenIndex !== null}
                >
                  {optie}
                </button>
              )
            })}
          </div>

          {gekozenIndex !== null && (
            <>
              <p className="quiz-kaart__uitleg">{vraag.uitleg}</p>
              <button type="button" className="quiz-kaart__volgende" onClick={volgende}>
                {index + 1 < QUIZVRAGEN.length ? 'Volgende vraag →' : 'Afronden →'}
              </button>
            </>
          )}
        </>
      )}

      {klaar && (
        <div className="quiz-kaart__uitslag" aria-live="polite">
          <p className="quiz-kaart__score">
            {goed}
            <span>/{QUIZVRAGEN.length}</span>
          </p>
          <p className="quiz-kaart__klaar">
            Je had {goed} van de {QUIZVRAGEN.length} goed.{' '}
            {getal(Math.round(stats.procentAllesGoed))}% van de {getal(stats.deelnemers)} spelers had alles goed.
          </p>
        </div>
      )}
    </div>
  )
}
