// Gedeeld teamfilter voor de sportdata-endpoints (?team=mannen|vrouwen).
// Standaard mannen, zodat bestaande aanroepen zonder filter blijven werken.
const TEAMS = ["mannen", "vrouwen"];

// Geeft het team terug, of stuurt zelf een 400 en geeft null terug.
function leesTeam(req, res) {
  const team = req.query.team ?? "mannen";
  if (!TEAMS.includes(team)) {
    res.status(400).json({ fout: "team moet mannen of vrouwen zijn" });
    return null;
  }
  return team;
}

module.exports = { TEAMS, leesTeam };
