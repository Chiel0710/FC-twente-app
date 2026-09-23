import { useState } from 'react'
import { stuurQuizAntwoord } from '../api'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import { QUIZVRAGEN } from '../quizData'

// Weekquiz — één vraag tegelijk in een rood vlak. Direct na een antwoord zie
// je of het goed was, daarna ga je zelf door naar de volgende vraag. Geen
// score of ranglijst (Fan-tab is voor de lol).
export default function QuizKaart() {
  const [index, setIndex] = useState(0)
  const [gekozenIndex, setGekozenIndex] = useState(null)

  const vraag = QUIZVRAGEN[index]
  const klaar = index >= QUIZVRAGEN.length

  function kies(i) {
    if (gekozenIndex !== null) return
    setGekozenIndex(i)
    stuurQuizAntwoord(HUIDIG_PROFIEL_ID, vraag.id, i, i === vraag.correcteIndex)
  }

  function volgende() {
    setGekozenIndex(null)
    setIndex((i) => i + 1)
  }

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

      {klaar && <p className="quiz-kaart__klaar">Dat was 'm — bedankt voor het meespelen!</p>}
    </div>
  )
}
