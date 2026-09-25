import { useState } from 'react'
import FanWereld from '../components/fan/FanWereld'
import FanRossie from '../components/fan/FanRossie'
import TegelOverlay from '../components/fan/TegelOverlay'
import VoorspelTegel from '../components/fan/VoorspelTegel'
import MotmTegel from '../components/fan/MotmTegel'
import PollTegel from '../components/fan/PollTegel'
import QuizTegel from '../components/fan/QuizTegel'
import WeetjeTegel from '../components/fan/WeetjeTegel'

// Terugvaloptie voor de pitch: true = de oude achtergrond (rossie-veld.mp4
// met vier ballen), false = de nieuwe Rossie-video met vijf ballen.
const GEBRUIK_OUDE_FAN = false

const TEGELS = {
  weetje: WeetjeTegel,
  quiz: QuizTegel,
  motm: MotmTegel,
  poll: PollTegel,
  voorspel: VoorspelTegel,
}

// startTegel: opent meteen een tegel, bv. 'motm' vanuit de eindsignaal-melding
export default function Fan({ startTegel = null }) {
  const [actief, setActief] = useState(startTegel)
  const ActieveTegel = actief ? (TEGELS[actief] ?? null) : null

  return (
    <>
      {GEBRUIK_OUDE_FAN ? <FanWereld onKies={setActief} /> : <FanRossie onKies={setActief} />}
      {ActieveTegel && (
        <TegelOverlay onSluit={() => setActief(null)}>
          <ActieveTegel />
        </TegelOverlay>
      )}
    </>
  )
}
