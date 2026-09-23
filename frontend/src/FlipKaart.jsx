import { useState } from "react";

/**
 * FlipKaart — draait om zijn as bij een klik.
 *
 * Je bestaande seizoenskaart geeft je mee als `voorkant`; die blijft dus
 * precies zoals hij is. De achterkant regelt dit bestand.
 *
 *   <FlipKaart
 *     voorkant={<MijnSeizoenskaart />}
 *     achterkant={<SeizoenskaartAchterkant {...} />}
 *   />
 */
export function FlipKaart({ voorkant, achterkant, label = "Seizoenskaart" }) {
  const [om, setOm] = useState(false);

  return (
    <div className="flip-scene">
      <button
        type="button"
        className={`flip-kaart${om ? " om" : ""}`}
        onClick={() => setOm((v) => !v)}
        aria-pressed={om}
        aria-label={`${label}, tik om te draaien`}
      >
        <div className="flip-zij flip-voor">{voorkant}</div>
        <div className="flip-zij flip-achter">{achterkant}</div>
      </button>
    </div>
  );
}

/**
 * De achterkant: toegangs-QR met de gegevens van de houder.
 *
 * `qr` is de QR als losse node — bijvoorbeeld een <img> met een data-URL of
 * een SVG die je van de backend haalt. Genereer hem NOOIT alleen in de client:
 * een echte toegangscode hoort van de server te komen en te verlopen.
 */
export function SeizoenskaartAchterkant({
  qr,
  kaartnummer,
  naam,
  vak,
  rij,
  stoel,
  geldigTot = "30-06-2027",
  vernieuwt = true,
}) {
  return (
    <div className="kaart-achter">
      <span className="ka-geldig">Geldig t/m {geldigTot}</span>
      {vernieuwt && (
        <span className="ka-live">
          <i />
          Live
        </span>
      )}

      <div className="ka-qr">{qr}</div>

      <p className="ka-nummer">{kaartnummer}</p>
      <p className="ka-sub">
        {vernieuwt && (
          <>
            Scan bij de poort · vernieuwt elke 60 sec
            <br />
          </>
        )}
        {naam} · Vak {vak}, rij {rij}, stoel {stoel}
      </p>
    </div>
  );
}
