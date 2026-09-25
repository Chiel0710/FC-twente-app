// De idle-loop van Rossie vooraf inladen (vanuit Meer), zodat hij bij het
// openen van het chatscherm direct speelt, zonder zwart beeld. De
// antwoordvideo's laadt RossieVideo.jsx zelf vooraf zodra het scherm open is.
import { IDLE_VIDEO } from './components/rossieVideos'

// Referentie bewaren, zodat de browser de gedownloade video vasthoudt
let idle = null

export function laadRossieVooraf() {
  if (idle) return
  idle = document.createElement('video')
  idle.preload = 'auto'
  idle.muted = true
  idle.src = IDLE_VIDEO
}
