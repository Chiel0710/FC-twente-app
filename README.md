# FC Twente fanapp (studentproject Fontys)

Geen officiële app van FC Twente. React + Vite, live op Vercel als één project.

## Hoe het in elkaar zit

- **frontend/**: de app. Alle data komt uit JSON-bestanden (`frontend/src/data/`, `frontend/public/`);
  wat een fan opslaat (stemmen, stickers, aanwezigheid, dealcodes) staat in localStorage op zijn eigen apparaat.
  De pitch-demo (FC Twente – PSV) draait ook in de browser (`src/demoKlok.js`).
- **api/**: serverless functions voor Vercel. Alleen Rossie: `api/rossie/index.js` (chat, Gemini) en
  `api/rossie/stem.js` (stem, ElevenLabs). De logica staat in `api/_lib/rossie.js`.
- **backend/**: de oude Express-backend met Prisma/SQLite. Lokaal alleen nog nodig voor Rossie
  (hij gebruikt dezelfde `api/_lib/rossie.js`); de live-versie gebruikt hem niet.

## Lokaal starten

1. Sleutels: kopieer `.env.example` naar `backend/.env` en vul `GOOGLE_API_KEY` in
   (ElevenLabs is optioneel; zonder gebruikt Rossie de browserstem). Zonder sleutel geeft Rossie een vast antwoord.
2. Backend (voor Rossie), poort 4000:
   ```
   cd backend
   npm install
   node server.js
   ```
3. Frontend, poort 5190 (de proxy stuurt `/api` door naar 4000):
   ```
   cd frontend
   npm install
   npm run dev
   ```
4. Open http://localhost:5190. De pitch start vanzelf; **herladen (F5) begint opnieuw**.
   `?pitch=0` zet de pitchmodus uit (dan blijft de stand staan bij herladen).

De productiebuild lokaal testen: `cd frontend && npm run build && npx vite preview` (poort 5191).

## Deployen (Vercel)

1. Push naar GitHub.
2. In Vercel: **Add New → Project** → deze repo importeren. Root Directory: de hoofdmap (niet `frontend`).
   De rest staat in `vercel.json` (build van `frontend`, output `frontend/dist`, functions in `api/`,
   alle andere paden naar `index.html`).
3. **Settings → Environment Variables**: `GOOGLE_API_KEY` (en eventueel `ELEVENLABS_API_KEY`,
   `ELEVENLABS_VOICE_ID`). Daarna opnieuw deployen.
4. Elke push naar de productietak (standaard `main`) zet een nieuwe versie live.

Sleutels staan nooit in git of in de frontend: `.env` staat in `.gitignore`.
