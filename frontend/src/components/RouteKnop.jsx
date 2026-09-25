import { ChevronRight, Map as MapIcoon } from 'lucide-react'
import { useNavigatie } from '../navigatie'
import '../plattegrond.css'

// "Route naar je plek" onder de seizoenskaart en op het kaartje: opent
// Meer → Plattegrond (/plattegrond) met je vak, de ingang en de route.
export default function RouteKnop() {
  const { openFeature } = useNavigatie()
  return (
    <button type="button" className="route-knop" onClick={() => openFeature('/plattegrond')}>
      <MapIcoon size={18} strokeWidth={2.2} aria-hidden="true" />
      <span>Route naar je plek</span>
      <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" className="route-knop__pijl" />
    </button>
  )
}
