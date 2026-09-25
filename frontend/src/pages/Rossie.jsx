import { useEffect, useRef, useState, useCallback } from "react";
import RossieVideo from "../components/RossieVideo";
import { koppelVraag, VIDEO_ANTWOORDEN } from "../components/rossieVideos";
import "../styles/rossie.css";
import { START, logRossieVraag } from "../lib/demoDb";
import { HUIDIGE_PERSONA, HUIDIG_PROFIEL_ID } from "../profiel";
import { berekenDemo } from "../demoKlok";

// Historie van de ingelogde fan (alleen Daan heeft er een), zodat Rossie hem
// kan gebruiken: "Je zat bij PEC Zwolle in vak 125..."
const HISTORIE = HUIDIGE_PERSONA.id === "daan"
  ? {
      naam: START.daan.naam,
      woonplaats: START.daan.woonplaats,
      tickets: START.daan.ticketHistorie,
      webshop: START.daan.gedrag.webshop,
      meestGebruikt: START.daan.gedrag.meestGebruikteFeature,
    }
  : null;

/**
 * Rossie — chatten met de mascotte.
 *
 * Lagen, elk met een terugval zodat er altijd iets werkt:
 *  1. vaste vragen ("wie ben jij?") -> kant-en-klare video met eigen geluid
 *  2. alle andere vragen: tekstchat via /api/rossie
 *  3. stem via /api/rossie/stem, anders de browserstem; Rossie wipt mee
 *  4. praten met de microfoon, anders gewoon typen
 *
 * Video's staan in /public/rossie/video/ (zie components/rossieVideos.js).
 */

/** Wat de fan te zien krijgt als de spraakherkenning faalt. */
const SPRAAKFOUTEN = {
  "not-allowed": "Ik mag je microfoon niet gebruiken. Klik op het slotje in de adresbalk en sta de microfoon toe.",
  "service-not-allowed": "Ik mag je microfoon niet gebruiken. Klik op het slotje in de adresbalk en sta de microfoon toe.",
  "no-speech": "Ik hoorde niks. Tik op de microfoon en praat maar!",
  "audio-capture": "Ik vind geen microfoon. Is er een aangesloten?",
  network: "Spraakherkenning heeft internet nodig. Typen kan altijd.",
};

export default function Rossie({ fantype = "standaard" }) {
  const [berichten, setBerichten] = useState([
    { rol: "rossie", tekst: "Hé, daar ben je! Vraag me gerust iets over de wedstrijd of de selectie." },
  ]);
  const [invoer, setInvoer] = useState("");
  const [bezig, setBezig] = useState(false);
  const [luistert, setLuistert] = useState(false);
  const [denkt, setDenkt] = useState(false); // wachten op /api/rossie
  const [praatLive, setPraatLive] = useState(false); // stem van een live antwoord speelt
  const [geluidAan, setGeluidAan] = useState(true);
  const [spraakMelding, setSpraakMelding] = useState("");

  const onder = useRef(null);
  const audioCtx = useRef(null);
  const audioEl = useRef(null);
  const herkenRef = useRef(null);
  const rossieRef = useRef(null);
  const bezigRef = useRef(false); // ook geldig in oude closures (bijv. herken.onend)
  const stemKlaar = useRef(null); // rondt de lopende stem af

  useEffect(() => { onder.current?.scrollIntoView({ behavior: "smooth" }); }, [berichten]);

  // Scherm verlaten: video, stem en microfoon stoppen
  useEffect(() => {
    const rossie = rossieRef.current;
    return () => {
      rossie?.stop();
      audioEl.current?.pause();
      stemKlaar.current?.();
      speechSynthesis.cancel();
      herkenRef.current?.abort();
    };
  }, []);

  /* ---------- 3. laten praten ---------- */
  // Geeft een belofte die klaar is als de stem uitgesproken is (of stopt).
  const spreek = useCallback(async (tekst) => {
    if (!geluidAan) return;
    audioCtx.current ||= new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.current.resume(); // iOS: mag pas na een tik van de gebruiker

    let afronden;
    const klaar = new Promise((resolve) => {
      afronden = () => { setPraatLive(false); stemKlaar.current = null; resolve(); };
    });
    stemKlaar.current = afronden;

    try {
      const r = await fetch("/api/rossie/stem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tekst }),
      });
      if (!r.ok) throw new Error("geen eigen stem");

      const url = URL.createObjectURL(await r.blob());
      const el = new Audio(url);
      audioEl.current = el;
      const bron = audioCtx.current.createMediaElementSource(el);
      bron.connect(audioCtx.current.destination);
      el.onended = () => { URL.revokeObjectURL(url); afronden(); };
      el.onpause = afronden; // ook als de stem wordt afgebroken
      el.onerror = afronden;
      await el.play();
      setPraatLive(true); // Rossie wipt mee op de idle-loop
    } catch {
      // terugval: de stem van de browser
      const u = new SpeechSynthesisUtterance(tekst);
      u.lang = "nl-NL"; u.rate = 1.03; u.pitch = 1.15;
      const stemmen = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("nl"));
      if (stemmen[0]) u.voice = stemmen[0];
      u.onstart = () => setPraatLive(true);
      u.onend = afronden;
      u.onerror = afronden;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
    return klaar;
  }, [geluidAan]);

  /* ---------- 1 en 2. vragen stellen ---------- */
  async function stuur(tekst) {
    const vraag = (tekst ?? invoer).trim();
    if (!vraag || bezigRef.current) return;
    // Er start een antwoord: microfoon uit, anders hoort hij Rossie zelf
    if (herkenRef.current) {
      herkenRef.current.afgebroken = true;
      herkenRef.current.abort();
    }
    setInvoer("");
    setBerichten((b) => [...b, { rol: "fan", tekst: vraag }]);
    // bezig tot de video of de stem klaar is: nooit twee antwoorden tegelijk
    bezigRef.current = true;
    setBezig(true);

    // 1. vaste vraag: video met eigen geluid, geen call naar de server
    // Elke vraag telt mee in de top 10 van de admin (Data > Rossie)
    logRossieVraag(HUIDIG_PROFIEL_ID, vraag);
    const sleutel = koppelVraag(vraag);
    if (sleutel) {
      setBerichten((b) => [...b, { rol: "rossie", tekst: VIDEO_ANTWOORDEN[sleutel].tekst }]);
      await rossieRef.current?.speel(sleutel);
      bezigRef.current = false;
      setBezig(false);
      return;
    }

    // 2. live chat
    setDenkt(true);
    try {
      const r = await fetch("/api/rossie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bericht: vraag,
          geschiedenis: berichten.slice(-8),
          fantype,
          historie: HISTORIE,
          // de mannenanalyse (Twente – PSV) pas na het eindsignaal van de pitch
          mannenAnalyseOpen: !["voor", "live", "rust"].includes(berekenDemo().fase),
        }),
      });
      const d = await r.json();
      setBerichten((b) => [...b, { rol: "rossie", tekst: d.antwoord }]);
      setDenkt(false);
      await spreek(d.antwoord);
    } catch {
      setBerichten((b) => [...b, { rol: "rossie", tekst: "Even geen verbinding. Probeer het zo nog eens!" }]);
    } finally {
      setDenkt(false);
      bezigRef.current = false;
      setBezig(false);
    }
  }

  /* ---------- 4. praten tegen Rossie ---------- */
  function microfoon() {
    // Nog een keer tikken tijdens het luisteren = stoppen (en versturen wat er al is)
    if (luistert) { herkenRef.current?.stop(); return; }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpraakMelding("Deze browser kan geen spraak herkennen. Gebruik Chrome of Edge, of typ je vraag.");
      return;
    }

    // Rossie eerst stil, anders hoort de microfoon zijn eigen stem
    speechSynthesis.cancel();
    audioEl.current?.pause();
    // Nu nog binnen de tik: de video mag straks met geluid spelen (Safari)
    rossieRef.current?.ontgrendel();

    const herken = new SR();
    // Referentie vasthouden: anders ruimt Chrome de herkenner soms op en komt er nooit een resultaat
    herkenRef.current = herken;
    herken.lang = "nl-NL";
    herken.interimResults = true; // tussenresultaten, zodat je live ziet wat hij verstaat
    let definitief = "";

    herken.onstart = () => {
      setSpraakMelding("");
      setInvoer("");
      setLuistert(true);
    };
    herken.onresult = (e) => {
      let tussen = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) definitief += r[0].transcript;
        else tussen += r[0].transcript;
      }
      setInvoer((definitief + tussen).trim()); // meeschrijven in het invoerveld
    };
    herken.onerror = (e) => {
      if (e.error !== "aborted") setSpraakMelding(SPRAAKFOUTEN[e.error] || `Spraak lukte niet (${e.error}). Typen kan altijd.`);
    };
    herken.onend = () => {
      herkenRef.current = null;
      setLuistert(false);
      // afgebroken omdat er al een antwoord start: niets meer versturen
      if (!herken.afgebroken && definitief.trim()) stuur(definitief.trim());
    };
    herken.start();
  }

  return (
    <div className="rossie-scherm">
      <div className="rossie-beeld">
        <RossieVideo ref={rossieRef} geluidAan={geluidAan} praatLive={praatLive} />
        {luistert && <span className="rossie-hint">Ik luister…</span>}
        {denkt && <span className="rossie-hint">Even denken…</span>}
        <button
          className="rossie-geluid"
          onClick={() => setGeluidAan((g) => !g)}
          aria-label={geluidAan ? "Geluid uit" : "Geluid aan"}
        >
          {geluidAan ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="rossie-gesprek">
        {berichten.map((m, i) => (
          <p key={i} className={m.rol === "fan" ? "van-fan" : "van-rossie"}>{m.tekst}</p>
        ))}
        <div ref={onder} />
      </div>

      {spraakMelding && <p className="rossie-melding" role="alert">{spraakMelding}</p>}

      <div className="rossie-balk">
        <button
          className={`mic ${luistert ? "luistert" : ""}`}
          onClick={microfoon}
          disabled={bezig}
          aria-pressed={luistert}
          aria-label={luistert ? "Stop met luisteren" : "Praat met Rossie"}
        >
          {luistert ? "■" : "🎤"}
        </button>
        <input
          value={invoer}
          onChange={(e) => setInvoer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && stuur()}
          placeholder={luistert ? "Praat maar, ik luister…" : "Vraag iets aan Rossie…"}
          aria-label="Je vraag"
          className={luistert ? "luistert" : ""}
        />
        <button className="stuur" onClick={() => stuur()} disabled={bezig || !invoer.trim()}>Stuur</button>
      </div>
    </div>
  );
}
