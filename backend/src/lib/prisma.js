// Eén gedeelde PrismaClient voor de hele app, zodat we niet per request
// een nieuwe databaseverbinding openen.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
