import { useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { useFeatureVolgorde } from '../featureVolgorde'
import { useNavigatie } from '../navigatie'
import PlaatjesTegel from './PlaatjesTegel'

// Tegelzone (bv. op Home): de plaatjes-tegels in de volgorde die bij het
// fantype van de fan hoort (zie featureVolgorde.js). Vierkante tegels vormen
// automatisch paren, brede tegels staan over de volle breedte.
// labels: { [featureId]: "tekst" } — klein rood label op een tegel.
// eigen: { [featureId]: element } — deze tegel zelf tekenen (bv. Ben je erbij
// met zijn tikvlakken); plek en volgorde blijven die van het featuresysteem.
export default function TegelZone({ zone, labels = {}, eigen = {} }) {
  const features = useFeatureVolgorde(zone)
  const { openFeature } = useNavigatie()
  const [binnenkort, setBinnenkort] = useState(null)
  const timer = useRef(null)

  function tik(feature) {
    if (openFeature(feature.route)) return
    // Nog geen scherm voor deze feature: kort "Binnenkort" op de tegel
    setBinnenkort(feature.id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setBinnenkort(null), 1800)
  }

  if (features.length === 0) return null

  return (
    <div className="tegel-zone">
      {inRijen(features).map((rij) => (
        <div className={`tegel-rij tegel-rij--${rij.soort}`} key={rij.tegels[0].id}>
          {rij.tegels.map((f) =>
            eigen[f.id] ? (
              <div key={f.id}>{eigen[f.id]}</div>
            ) : f.tegel ? (
              <PlaatjesTegel
                key={f.id}
                id={f.id}
                titel={f.titel}
                label={labels[f.id]}
                onTik={() => tik(f)}
                binnenkort={binnenkort === f.id}
              />
            ) : (
              <CodeTegel key={f.id} feature={f} onTik={() => tik(f)} />
            ),
          )}
        </div>
      ))}
    </div>
  )
}

// Feature zonder afbeelding in tegels.json (bv. recap60): brede tegel in code,
// in dezelfde stijl als de plaatjes-tegels
function CodeTegel({ feature, onTik }) {
  return (
    <button type="button" className="code-tegel" onClick={onTik} aria-label={feature.titel}>
      <span className="code-tegel__titel">{feature.titel}</span>
      <span className="code-tegel__actie">
        <Play size={16} strokeWidth={2.4} aria-hidden="true" />
        Bekijk de highlights
      </span>
    </button>
  )
}

// Tegels in rijen: brede tegels krijgen een eigen rij; twee vierkante vormen
// een paar op de plek van de eerste. Blijft er één vierkante over (oneven
// aantal), dan staat die gecentreerd in zijn eigen rij in plaats van links
// met een gat ernaast.
function inRijen(features) {
  const rijen = []
  let open = null // rij met één vierkante tegel die nog een buur zoekt
  for (const f of features) {
    if ((f.tegel?.vorm ?? 'breed') === 'vierkant') {
      if (open) {
        open.tegels.push(f)
        open.soort = 'paar'
        open = null
      } else {
        open = { soort: 'alleen', tegels: [f] }
        rijen.push(open)
      }
    } else {
      rijen.push({ soort: 'breed', tegels: [f] })
    }
  }
  return rijen
}
