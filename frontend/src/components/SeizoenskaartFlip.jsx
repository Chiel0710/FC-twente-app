import { useRef } from 'react'
import { FlipKaart } from '../FlipKaart'
import { useTegels } from '../featureVolgorde'
import { useSeizoenskaartQr } from '../seizoenskaartQr'
import { HUIDIGE_PERSONA, VOORBEELD_HOUDER } from '../profiel'
import '../flipkaart.css'

// Seizoenskaart bovenaan Tickets: tik = 3D-flip (bestaande FlipKaart).
//  - voorkant: /home/seizoenskaart-voor.png, geplaatst volgens tegels.json
//  - achterkant: in code, in de stijl van /home/seizoenskaart-achter.png
//    (dat plaatje is alleen referentie): naam, seizoen, vak/rij/stoel en de
//    toegangs-QR van de server op een licht roze vlak, onderaan een magneetstrip
// Gegevens uit het profiel (seizoenskaart van de persona). Zonder eigen kaart
// tonen we die van Johan de Heer met het label "Voorbeeld".
const VOORBEELD = VOORBEELD_HOUDER // data/voorbeeld-seizoenskaart.json

function Voorkant({ tegel }) {
  if (!tegel) return <span className="sk-voor" />
  return (
    <span className="sk-voor">
      <img
        src={tegel.afbeelding}
        alt=""
        style={{ width: `${tegel.img['breedte%']}%`, left: `${tegel.img['links%']}%`, top: `${tegel.img['boven%']}%` }}
      />
    </span>
  )
}

function Achterkant({ houder, kaart }) {
  const { seizoen, vak, rij, stoel } = houder.seizoenskaart
  return (
    <span className="sk-achter">
      <span className="sk-achter__naam">{houder.naam}</span>
      <span className="sk-achter__seizoen">Seizoenskaart seizoen {seizoen}</span>
      <span className="sk-achter__plaats">
        <span>Vak {vak}</span>
        <span>Rij {rij}</span>
        <span>Stoel {stoel}</span>
      </span>
      <span className="sk-achter__qr">
        {kaart ? (
          <img src={kaart.qr} alt={`Toegangs-QR van ${houder.naam}`} />
        ) : (
          <span className="sk-achter__qr-tekst">{kaart === null ? 'QR niet beschikbaar' : 'QR laden…'}</span>
        )}
      </span>
      <span className="sk-achter__strip" aria-hidden="true" />
    </span>
  )
}

export default function SeizoenskaartFlip() {
  const eigen = Boolean(HUIDIGE_PERSONA.seizoenskaart)
  const houder = eigen ? HUIDIGE_PERSONA : VOORBEELD
  const sceneRef = useRef(null)
  // Transparante QR: de blokjes staan dan direct op het roze vlak
  const kaart = useSeizoenskaartQr(`demo-${houder.id}`, sceneRef, { transparant: true })
  const tegels = useTegels()
  const voor = tegels?.tegels?.find((t) => t.id === 'seizoenskaart-voor')

  return (
    <section
      ref={sceneRef}
      className="sk"
      style={{ '--verhouding': voor?.kaartVerhouding ?? 1.536 }}
      aria-label={eigen ? 'Jouw seizoenskaart' : 'Voorbeeld van een seizoenskaart'}
    >
      {!eigen && <span className="voorbeeld-label sk__voorbeeld">Voorbeeld</span>}
      <FlipKaart
        label={`Seizoenskaart van ${houder.naam}`}
        voorkant={<Voorkant tegel={voor} />}
        achterkant={<Achterkant houder={houder} kaart={kaart} />}
      />
    </section>
  )
}
