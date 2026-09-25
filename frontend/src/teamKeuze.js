import { createContext, useContext } from 'react'

// Welk team de fan volgt: "mannen" of "vrouwen". Eén keuze voor de hele app
// (Home, Wedstrijden, Selectie). App.jsx houdt hem bij en slaat hem op in het
// profiel; pagina's lezen hem met useTeamKeuze().
export const TeamKeuzeContext = createContext({ team: 'mannen', kiesTeam: () => {} })

export function useTeamKeuze() {
  return useContext(TeamKeuzeContext)
}

export const TEAM_LABEL = { mannen: 'Mannen', vrouwen: 'Vrouwen' }
