import { useEffect, useMemo, useState } from "react";
import "../../fanshop.css";

/**
 * Fanshop — toont de echte FC Twente-collectie van Castore in onze eigen huisstijl.
 * De koopknop opent het product bij Castore; elke doorklik wordt gemeten,
 * zodat de club ziet wat de app oplevert.
 *
 * Geen productfoto's van Castore: we tekenen zelf een shirt, short of sok in
 * clubkleuren. Dat scheelt rechtenzorg en laadt sneller.
 */
const GROEPEN = ["Alles", "Heren", "Dames", "Junior"];

export default function Fanshop({ profileId }) {
  const [data, setData] = useState(null);
  const [fout, setFout] = useState(false);
  const [groep, setGroep] = useState("Alles");

  useEffect(() => {
    fetch("/api/fanshop")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setFout(true));
  }, []);

  const perCategorie = useMemo(() => {
    if (!data) return [];
    const lijst = data.producten.filter((p) => groep === "Alles" || p.groep === groep);
    const volgorde = ["Shirts", "Tenues", "Broeken", "Sokken", "Overig"];
    return volgorde
      .map((c) => [c, lijst.filter((p) => p.categorie === c)])
      .filter(([, items]) => items.length);
  }, [data, groep]);

  function open(product) {
    // eerst meten, dan pas openen — maar niet wachten op het antwoord
    navigator.sendBeacon?.(
      "/api/fanshop/klik",
      new Blob(
        [JSON.stringify({ profileId, productId: product.id, naam: product.naam, bron: "fanshop" })],
        { type: "application/json" }
      )
    );
    window.open(product.url, "_blank", "noopener,noreferrer");
  }

  if (fout) return <p className="shop-leeg">De fanshop is even niet bereikbaar. Probeer het later nog eens.</p>;
  if (!data) return <p className="shop-leeg">Collectie laden…</p>;

  return (
    <div className="shop">
      <header className="shop-kop">
        <p className="shop-label">Officiële collectie</p>
        <h1>Fanshop</h1>
        <p className="shop-sub">
          Het tenue van dit seizoen, rechtstreeks bij Castore.
          {data.bron === "snapshot" && ` Prijzen van ${data.bijgewerkt}.`}
        </p>
      </header>

      <div className="shop-filters" role="tablist" aria-label="Filter op groep">
        {GROEPEN.map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={groep === g}
            className={groep === g ? "aan" : ""}
            onClick={() => setGroep(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {perCategorie.map(([categorie, items]) => (
        <section key={categorie} className="shop-sectie">
          <h2>{categorie}</h2>
          <div className="shop-grid">
            {items.map((p) => (
              <article key={p.id} className="shop-kaart">
                <Illustratie categorie={p.categorie} />
                <h3>{kort(p.naam)}</h3>
                <p className="shop-prijs">
                  {p.prijs != null ? `€ ${p.prijs.toFixed(2).replace(".", ",")}` : "Prijs op aanvraag"}
                </p>
                {p.opVoorraad === false && <p className="shop-uit">Tijdelijk uitverkocht</p>}
                <button onClick={() => open(p)}>Bekijk bij Castore</button>
              </article>
            ))}
          </div>
        </section>
      ))}

      <p className="shop-voet">
        Je verlaat de app als je op een product tikt. Bestellen en betalen gaat via Castore.
      </p>
    </div>
  );
}

/** "FC Twente heren 26/27 thuisshirt" → "Heren 26/27 thuisshirt" */
function kort(naam) {
  return naam.replace(/^FC Twente\s*/i, "").replace(/^\w/, (c) => c.toUpperCase());
}

/** Eigen illustratie per categorie — geen beeld van Castore of de club. */
function Illustratie({ categorie }) {
  const paden = {
    Shirts: "M18 14 32 8l8 5 8-5 14 6-4 12-8-3v29H30V23l-8 3z",
    Tenues: "M20 12 32 7l8 4 8-4 12 5-3 10-7-2v18H27V20l-7 2zM26 44h20l3 17H23z",
    Broeken: "M20 14h28l4 34H38l-4-19-4 19H16z",
    Sokken: "M26 8h14v28l10 10-8 10-16-16z",
    Overig: "M16 18h32v30H16z",
  };
  return (
    <svg className="shop-illu" viewBox="0 0 64 64" aria-hidden="true">
      <path d={paden[categorie] || paden.Overig} fill="currentColor" />
    </svg>
  );
}
