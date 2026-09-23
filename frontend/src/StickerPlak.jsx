import { useRef, useState, useCallback } from "react";

/**
 * useStickerPlak — regelt het claimen en "plakken" van een sticker.
 *
 * Werking:
 *  1. claim(sticker)  -> zet de overlay aan, kaart komt met animatie in beeld
 *  2. plak()          -> FLIP-animatie: een kopie van de kaart vliegt naar het
 *                        lege vakje in het raster, daarna stempel-effect
 *
 * Je geeft zelf een functie mee die het vakje (DOM-element) opzoekt bij een
 * matchId, zodat de hook niets van jouw opbouw hoeft te weten.
 */
export function useStickerPlak({ vindSlot, onGeplakt }) {
  const [actief, setActief] = useState(null); // de sticker die geclaimd wordt
  const kaartRef = useRef(null);

  // Respecteer de systeeminstelling voor minder beweging
  const kalm =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const deeltjes = useCallback(
    (x, y, aantal = 26) => {
      if (kalm) return;
      const kleuren = ["#D81E1E", "#ffffff", "#A6120C", "#C9A227"];
      for (let i = 0; i < aantal; i++) {
        const p = document.createElement("i");
        p.className = "deeltje";
        const hoek = Math.random() * Math.PI * 2;
        const afstand = 60 + Math.random() * 190;
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.background = kleuren[i % kleuren.length];
        p.style.setProperty("--dx", `${Math.cos(hoek) * afstand}px`);
        p.style.setProperty("--dy", `${Math.sin(hoek) * afstand + 120}px`);
        p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
        p.style.setProperty("--duur", `${700 + Math.random() * 600}ms`);
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1400);
      }
    },
    [kalm]
  );

  const claim = useCallback(
    (sticker) => {
      setActief(sticker);
      // wacht tot de kaart in de DOM staat, dan pas deeltjes
      setTimeout(() => {
        const el = kaartRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        deeltjes(r.left + r.width / 2, r.top + r.height / 2, 28);
      }, 260);
    },
    [deeltjes]
  );

  const plak = useCallback(() => {
    const sticker = actief;
    const kaart = kaartRef.current;
    const slot = vindSlot(sticker.matchId);
    if (!sticker || !kaart || !slot) return;

    const van = kaart.getBoundingClientRect();
    slot.scrollIntoView({ block: "center", behavior: kalm ? "auto" : "smooth" });

    const afronden = () => {
      onGeplakt(sticker); // hier zet je hem in je state als "geplakt"
      setActief(null);
      // stempel-effect + kleine deeltjesbui op het vakje zelf
      requestAnimationFrame(() => {
        const doel = vindSlot(sticker.matchId);
        if (!doel) return;
        doel.classList.add("geplakt");
        const c = doel.getBoundingClientRect();
        deeltjes(c.left + c.width / 2, c.top + c.height / 2, 16);
        setTimeout(() => doel.classList.remove("geplakt"), 500);
      });
    };

    if (kalm) {
      afronden();
      return;
    }

    // FLIP: kopie van de kaart die naar het vakje vliegt
    const vlieg = kaart.cloneNode(true);
    vlieg.classList.add("vliegt");
    vlieg.classList.remove("onthul");
    Object.assign(vlieg.style, {
      left: `${van.left}px`,
      top: `${van.top}px`,
      width: `${van.width}px`,
      height: `${van.height}px`,
    });
    document.body.appendChild(vlieg);
    setActief(null); // overlay sluit, de kopie blijft zichtbaar

    requestAnimationFrame(() => {
      const nu = slot.getBoundingClientRect();
      const sx = nu.width / van.width;
      const sy = nu.height / van.height;
      const dx = nu.left + nu.width / 2 - (van.left + van.width / 2);
      const dy = nu.top + nu.height / 2 - (van.top + van.height / 2);
      vlieg.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotate(6deg)`;
      vlieg.style.opacity = "0";
    });

    setTimeout(() => {
      vlieg.remove();
      afronden();
    }, 880);
  }, [actief, vindSlot, onGeplakt, deeltjes, kalm]);

  return { actief, kaartRef, claim, plak, sluit: () => setActief(null) };
}

/** De kaart zelf — zowel in de overlay als in een gevuld vakje bruikbaar. */
export function StickerKaart({ sticker, groot = false, innerRef }) {
  return (
    <div
      ref={innerRef}
      className={`kaart${groot ? " onthul" : ""}${sticker.europees ? " cl" : ""}`}
    >
      <div className="glans" />
      <div className="badge">
        <img src={`/logos/${sticker.logoSlug}.png`} alt="" />
      </div>
      <p className="tegen">{sticker.tegenstander}</p>
      <p className="score">{sticker.uitslag ?? "—"}</p>
      <p className="meta">
        {sticker.thuis ? "Thuis" : "Uit"} · {sticker.datum}
      </p>
      <p className="serie">#{sticker.volgnummer}</p>
    </div>
  );
}

/** Overlay met de onthulling en de knop om te plakken. */
export function ClaimOverlay({ sticker, kaartRef, onPlak, onSluit }) {
  if (!sticker) return null;
  return (
    <div
      className="laag aan"
      role="dialog"
      aria-modal="true"
      aria-label="Nieuwe sticker"
      onClick={(e) => e.target === e.currentTarget && onSluit()}
    >
      <div className="pakje">
        <StickerKaart sticker={sticker} groot innerRef={kaartRef} />
        <p>Sticker vrijgespeeld</p>
        <button onClick={onPlak}>Plak in je plakboek</button>
      </div>
    </div>
  );
}
