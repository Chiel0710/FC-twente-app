-- Vrouwenselectie erbij: elke speler hoort bij een team.
-- Bestaande spelers zijn het eerste elftal van de mannen.
ALTER TABLE "Player" ADD COLUMN "team" TEXT NOT NULL DEFAULT 'mannen';

-- Eén lijn met de selectie-JSON's: fotoUrl heet voortaan foto.
-- Met de hand als RENAME geschreven (Prisma zou de kolom weggooien en
-- opnieuw aanmaken, dan zijn alle fotopaden weg).
ALTER TABLE "Player" RENAME COLUMN "fotoUrl" TO "foto";
