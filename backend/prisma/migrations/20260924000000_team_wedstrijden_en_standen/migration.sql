-- Vrouwen erbij: wedstrijden krijgen een team, competitielogo en dagDefinitief;
-- venue wordt optioneel (het vrouwenschema noemt geen stadion). Standen krijgen
-- een eigen tabel (StandRij), omdat dezelfde club in beide standen staat.
-- Profiel onthoudt welk team de fan volgt (teamKeuze).
-- SQLite kan kolommen niet aanpassen, dus Match en Profile worden opnieuw
-- opgebouwd; alle bestaande rijen worden daarbij meegekopieerd.

-- CreateTable
CREATE TABLE "StandRij" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "team" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "positie" INTEGER NOT NULL,
    "gespeeld" INTEGER NOT NULL,
    "doelsaldo" INTEGER NOT NULL,
    "punten" INTEGER NOT NULL,
    "zone" TEXT,
    "gewonnen" INTEGER,
    "gelijk" INTEGER,
    "verloren" INTEGER,
    "doelpuntenVoor" INTEGER,
    "doelpuntenTegen" INTEGER,
    CONSTRAINT "StandRij_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competition" TEXT NOT NULL DEFAULT 'Eredivisie',
    "matchday" INTEGER,
    "kickoff" DATETIME NOT NULL,
    "aftrapBekend" BOOLEAN NOT NULL DEFAULT true,
    "dagDefinitief" BOOLEAN NOT NULL DEFAULT true,
    "competitieLogo" TEXT,
    "team" TEXT NOT NULL DEFAULT 'mannen',
    "venue" TEXT,
    "status" TEXT NOT NULL,
    "thuisTeamId" TEXT NOT NULL,
    "uitTeamId" TEXT NOT NULL,
    "thuisScore" INTEGER,
    "uitScore" INTEGER,
    "toeschouwers" INTEGER,
    "bron" TEXT,
    "compleet" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Match_thuisTeamId_fkey" FOREIGN KEY ("thuisTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_uitTeamId_fkey" FOREIGN KEY ("uitTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("aftrapBekend", "bron", "competition", "compleet", "id", "kickoff", "matchday", "status", "thuisScore", "thuisTeamId", "toeschouwers", "uitScore", "uitTeamId", "venue") SELECT "aftrapBekend", "bron", "competition", "compleet", "id", "kickoff", "matchday", "status", "thuisScore", "thuisTeamId", "toeschouwers", "uitScore", "uitTeamId", "venue" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "fantype" TEXT NOT NULL,
    "bezoekfrequentie" TEXT,
    "woonregio" TEXT,
    "volgtVia" TEXT,
    "metWie" TEXT,
    "teamKeuze" TEXT NOT NULL DEFAULT 'mannen',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Profile" ("bezoekfrequentie", "createdAt", "fantype", "id", "metWie", "naam", "updatedAt", "volgtVia", "woonregio") SELECT "bezoekfrequentie", "createdAt", "fantype", "id", "metWie", "naam", "updatedAt", "volgtVia", "woonregio" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StandRij_team_clubId_key" ON "StandRij"("team", "clubId");

