import { useState } from 'react'
import FanWereld from '../components/fan/FanWereld'
import TegelOverlay from '../components/fan/TegelOverlay'
import VoorspelTegel from '../components/fan/VoorspelTegel'
import MotmTegel from '../components/fan/MotmTegel'
import PollTegel from '../components/fan/PollTegel'
import QuizTegel from '../components/fan/QuizTegel'

const TEGELS = {
  quiz: QuizTegel,
  motm: MotmTegel,
  poll: PollTegel,
  voorspel: VoorspelTegel,
}

export default function Fan() {
  const [actief, setActief] = useState(null)
  const ActieveTegel = actief ? TEGELS[actief] : null

  return (
    <>
      <FanWereld onKies={setActief} />
      {ActieveTegel && (
        <TegelOverlay onSluit={() => setActief(null)}>
          <ActieveTegel />
        </TegelOverlay>
      )}
    </>
  )
}
