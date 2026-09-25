import { createContext, useContext } from 'react'

// Features openen via hun route uit features.json ("/rossie", "/stemmen", ...).
// De app heeft geen router; App.jsx vertaalt een route naar de juiste tab of
// laag. kanOpenen(route) = bestaat er al een scherm voor; zo niet: "Binnenkort".
export const NavigatieContext = createContext({
  openFeature: () => false,
  kanOpenen: () => false,
})

export function useNavigatie() {
  return useContext(NavigatieContext)
}
