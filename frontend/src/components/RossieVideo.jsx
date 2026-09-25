import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { IDLE_VIDEO, VIDEO_ANTWOORDEN } from "./rossieVideos";
import "../styles/rossie-video.css";

/**
 * RossieVideo — Rossie in beeld.
 *
 * Twee video's over elkaar:
 *  - onder: de idle-loop (knippert, ademt), speelt altijd, zonder geluid
 *  - boven: het antwoord, faded in ~150 ms in en na afloop weer uit
 *
 * Gebruik vanuit de ouder via een ref:
 *   const rossie = useRef();
 *   await rossie.current.speel("wie");   // resolved als de video klaar is
 *
 * props:
 *   geluidAan  — false = antwoord zonder geluid (knop 🔇 in het scherm)
 *   praatLive  — true tijdens een live chat-antwoord: Rossie wipt licht mee
 */
const RossieVideo = forwardRef(function RossieVideo({ geluidAan = true, praatLive = false }, ref) {
  const idle = useRef(null);
  const antwoord = useRef(null);
  const klaar = useRef(null); // resolve-functie van de lopende speel()-belofte
  const [antwoordZichtbaar, setAntwoordZichtbaar] = useState(false);

  // Alle antwoordvideo's vooraf laden, anders geeft de eerste vraag een zwart frame.
  useEffect(() => {
    const cache = Object.values(VIDEO_ANTWOORDEN).map(({ src }) => {
      const v = document.createElement("video");
      v.preload = "auto";
      v.src = src;
      return v;
    });
    return () => cache.forEach((v) => v.removeAttribute("src"));
  }, []);

  // Geluidsknop werkt ook op een antwoord dat al loopt
  useEffect(() => {
    if (antwoord.current && klaar.current) antwoord.current.muted = !geluidAan;
  }, [geluidAan]);

  useImperativeHandle(ref, () => ({
    /** Speelt een antwoordvideo af. Geeft true terug als het lukte. */
    async speel(sleutel) {
      const item = VIDEO_ANTWOORDEN[sleutel];
      const el = antwoord.current;
      if (!item || !el) return false;

      el.src = item.src;
      el.currentTime = 0;
      el.muted = !geluidAan;
      try {
        await el.play();
      } catch {
        // Browser blokkeert geluid zonder tik: dan maar zonder geluid, het beeld loopt wel.
        el.muted = true;
        try { await el.play(); } catch { return false; }
      }
      setAntwoordZichtbaar(true);
      return new Promise((resolve) => { klaar.current = resolve; });
    },
    /**
     * Aanroepen direct bij een tik (bijv. op de microfoon). Safari laat een
     * video alleen met geluid spelen als die al eens na een tik is gestart;
     * bij een spraakvraag start speel() pas later. Kort stil starten en weer
     * pauzeren is genoeg.
     */
    ontgrendel() {
      const el = antwoord.current;
      if (!el || klaar.current) return;
      if (!el.src) el.src = VIDEO_ANTWOORDEN.wie.src;
      el.muted = true;
      el.play().then(() => { if (!klaar.current) el.pause(); }).catch(() => {});
    },
    /** Breekt een lopend antwoord af (bijv. als de gebruiker weggaat). */
    stop() {
      antwoord.current?.pause();
      afronden();
    },
  }));

  function afronden() {
    // Loop terug naar het begin: loop en antwoord starten met hetzelfde beeld.
    if (idle.current) {
      idle.current.currentTime = 0;
      idle.current.play().catch(() => {});
    }
    setAntwoordZichtbaar(false);
    klaar.current?.(true);
    klaar.current = null;
  }

  return (
    <div className={`rossie-video ${praatLive ? "praat-live" : ""}`}>
      <video
        ref={idle}
        className="rossie-video__idle"
        src={IDLE_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <video
        ref={antwoord}
        className={`rossie-video__antwoord ${antwoordZichtbaar ? "zichtbaar" : ""}`}
        playsInline
        preload="auto"
        onEnded={afronden}
        onError={afronden}
        aria-hidden="true"
      />
    </div>
  );
});

export default RossieVideo;
