import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Rossie from './Rossie'
import { laadRossieVooraf } from '../rossieVooraf'

// /rossie — het chatscherm van Rossie (ongewijzigd aangeleverd) als laag over
// de app, met een terugknop: Rossie.jsx zelf heeft er geen.
export default function RossiePagina({ fantype, onTerug }) {
  useEffect(() => {
    laadRossieVooraf()
  }, [])

  return (
    <div className="rossie-laag">
      <Rossie fantype={fantype} />
      <button type="button" className="rossie-terug" onClick={onTerug} aria-label="Terug naar de app">
        <ArrowLeft strokeWidth={2.2} size={18} />
        <span>Terug</span>
      </button>
    </div>
  )
}
