// Gedeelde Prisma-include voor wedstrijden, zodat elk endpoint dezelfde
// teamnamen en events meestuurt zonder de query steeds opnieuw te schrijven.
const MATCH_INCLUDE = {
  thuisTeam: true,
  uitTeam: true,
  events: { orderBy: { minute: "asc" } },
};

module.exports = { MATCH_INCLUDE };
