import { useEffect, useRef, useState } from "react";
import { berekenDemo, naarDagErna } from "../demoKlok";

/**
 * useDemo — rekent elke seconde de stand van de demo uit (demoKlok.js).
 *
 * Er is geen server meer die de fase bijhoudt: alles volgt uit één opgeslagen
 * starttijd, dus ook na herladen klopt de minuut en komen oude meldingen
 * niet opnieuw als toast. Elk apparaat speelt zijn eigen pitch.
 */
const MIN_TOAST_MS = 4000; // elke melding minstens zo lang in beeld

export function useDemo() {
  const [state, setState] = useState(null);
  const gezien = useRef(new Set());
  const eerste = useRef(true);
  const [nieuweMelding, setNieuweMelding] = useState(null);
  // Wachtrij: komen er twee meldingen vlak na elkaar (bv. 26' en 29'), dan
  // wacht de tweede tot de eerste MIN_TOAST_MS heeft gestaan
  const wachtrij = useRef([]);
  const getoondOp = useRef(0);

  useEffect(() => {
    let leeft = true;
    const haal = () => {
      try {
        const d = berekenDemo();
        if (!leeft) return;
        // Afteller van de pitch: server geeft "nog zoveel ms", wij maken er een
        // vast tijdstip van (zo loopt de klok ook tussen twee polls door)
        const aftrapLokaal = d.restMs != null ? Date.now() + d.restMs : null;
        setState({ ...d, aftrapLokaal });
        const meldingen = d.meldingen || [];
        // De dag erna is een gewone dag: geen toasts meer (de inbox blijft)
        const dagErna = d.fase === "dagerna";
        if (dagErna) wachtrij.current = [];
        // na een reset (geen meldingen meer) alles vergeten, zodat dezelfde meldingen opnieuw als toast komen
        if (!meldingen.length) {
          gezien.current.clear();
          wachtrij.current = [];
        }
        for (const m of meldingen) {
          if (gezien.current.has(m.id)) continue;
          gezien.current.add(m.id);
          // Wat er bij het openen van de app al lag, staat in de inbox; geen toast
          if (!eerste.current && !dagErna) wachtrij.current.push(m);
        }
        eerste.current = false;
      } catch {
        /* stil falen: de demo mag nooit een foutscherm geven */
      }
    };
    haal();
    const t = setInterval(haal, 1000);

    // Volgende melding uit de wachtrij tonen zodra de vorige lang genoeg stond
    const toon = setInterval(() => {
      if (!wachtrij.current.length || Date.now() - getoondOp.current < MIN_TOAST_MS) return;
      getoondOp.current = Date.now();
      setNieuweMelding(wachtrij.current.shift());
    }, 250);

    return () => { leeft = false; clearInterval(t); clearInterval(toon); };
  }, []);

  return {
    state,
    nieuweMelding,
    // zelf weggetikt: de volgende mag meteen
    sluitMelding: () => { getoondOp.current = 0; setNieuweMelding(null); },
  };
}

/**
 * Tik op het clublogo in de kopbalk: door naar de dag erna (fase "dagerna").
 * Werkt in elke fase; daarna is het een gewone dag zonder meldingen of live
 * wedstrijd. Opnieuw beginnen = de app herladen (pitchmodus).
 */
export function useLogoTik(fase) {
  return () => {
    if (fase === "dagerna") return;
    naarDagErna();
  };
}

/** Livescore — minuut, stand en gebeurtenissen die binnendruppelen. */
export function LiveScore({ state, onOpenRecap }) {
  if (!state) return null;
  const { fase, minuut, wedstrijd, stand, gebeurtenissen } = state;

  if (fase === "voor") {
    return (
      <article className="live live-voor">
        <p className="live-label">Vanmiddag 16:45</p>
        <h3>{wedstrijd.thuis} – {wedstrijd.uit}</h3>
        <p className="live-tv">Te zien bij {wedstrijd.uitzending}</p>
      </article>
    );
  }

  const bezig = fase === "live" || fase === "rust";
  return (
    <article className={`live ${bezig ? "live-bezig" : "live-klaar"}`} aria-live="polite">
      <p className="live-label">
        {fase === "rust" ? "Rust" : fase === "live" ? <><i className="stip" />{minuut}'</> : "Eindstand"}
      </p>

      <div className="live-stand">
        <span>{wedstrijd.thuis}</span>
        <strong>{stand.thuis} – {stand.uit}</strong>
        <span>{wedstrijd.uit}</span>
      </div>

      <ul className="live-tijdlijn">
        {gebeurtenissen.map((g, i) => (
          <li key={i} className={g.team === wedstrijd.thuis ? "voor-ons" : "tegen"}>
            <b>{g.minuut}'</b> {g.speler} <span>{g.stand}</span>
          </li>
        ))}
      </ul>

      {fase !== "live" && fase !== "rust" && (
        <button onClick={onOpenRecap}>Twente in 60 seconden</button>
      )}
    </article>
  );
}

/**
 * MeldingToast — ziet eruit als een pushmelding, maar dan in de app.
 * De tekst is dezelfde voor iedereen; de knop eronder verschilt per fantype.
 */
export function MeldingToast({ melding, fantype = "standaard", onSluit, onGa }) {
  useEffect(() => {
    if (!melding) return;
    const t = setTimeout(onSluit, 9000);
    return () => clearTimeout(t);
  }, [melding, onSluit]);

  if (!melding) return null;
  const v = melding.varianten[fantype === "afstand" ? "afstand" : "standaard"];

  return (
    <div className="toast" role="status">
      <div className="toast-kop">
        <span className="toast-logo" aria-hidden="true">⚽</span>
        <span className="toast-app">FC Twente</span>
        <span className="toast-nu">nu</span>
        <button className="toast-x" onClick={onSluit} aria-label="Sluiten">×</button>
      </div>
      <p className="toast-titel">{melding.titel}</p>
      <p className="toast-tekst">{v.tekst}</p>
      <button className="toast-knop" onClick={() => onGa(v.route)}>{v.knop}</button>
    </div>
  );
}

/** Inbox — alles wat als melding binnenkwam, achter het briefje linksboven. */
export function Inbox({ meldingen = [], fantype = "standaard", onGa }) {
  if (!meldingen.length) {
    return <p className="inbox-leeg">Nog geen berichten. Na de wedstrijd vind je ze hier terug.</p>;
  }
  return (
    <ul className="inbox">
      {meldingen.map((m) => {
        const v = m.varianten[fantype === "afstand" ? "afstand" : "standaard"];
        return (
          <li key={m.id}>
            <p className="inbox-titel">{m.titel}</p>
            <p className="inbox-tekst">{v.tekst}</p>
            <button onClick={() => onGa(v.route)}>{v.knop}</button>
          </li>
        );
      })}
    </ul>
  );
}
