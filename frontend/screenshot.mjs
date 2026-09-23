// Screenshot-hulpje voor visuele controle van de app tijdens development.
// Gebruik: node screenshot.mjs <url> [label] [--desktop]
// Slaat op in ./temporary screenshots/screenshot-N[-label].png
import puppeteer from 'puppeteer'
import { mkdirSync, readdirSync } from 'fs'
import path from 'path'

const url = process.argv[2]
const rest = process.argv.slice(3)
const desktop = rest.includes('--desktop')
const label = rest.find((a) => !a.startsWith('--'))

if (!url) {
  console.error('Gebruik: node screenshot.mjs <url> [label] [--desktop]')
  process.exit(1)
}

const dir = path.join(process.cwd(), 'temporary screenshots')
mkdirSync(dir, { recursive: true })

const bestaand = readdirSync(dir).filter((f) => f.startsWith('screenshot-'))
const volgendNummer = bestaand.length + 1
const bestandsnaam = `screenshot-${volgendNummer}${label ? `-${label}` : ''}.png`
const bestandspad = path.join(dir, bestandsnaam)

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.setViewport(
  desktop ? { width: 1280, height: 900 } : { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
)
await page.goto(url, { waitUntil: 'networkidle0' })
// even wachten zodat animaties/afbeeldingen klaar zijn
await new Promise((r) => setTimeout(r, 400))
await page.screenshot({ path: bestandspad, fullPage: true })
await browser.close()

console.log(`Opgeslagen: ${bestandspad}`)
