#!/usr/bin/env node
/*
  Fetch Spain provinces and Portugal districts GeoJSON and save to public/geo.
  You can run: npm run fetch-geo
*/

const fs = require('fs')
const path = require('path')
const https = require('https')

const outDir = path.join(__dirname, '..', 'public', 'geo')
const targets = [
  {
    name: 'spain-provinces.geojson',
    candidates: [
      // Opendatasoft dataset exports
      'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/provinces-of-spain/exports/geojson?lang=en&timezone=UTC',
      'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-spain-province/exports/geojson?lang=en&timezone=UTC',
      // GitHub fallback
      'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/spain-provinces.geojson',
    ],
  },
  {
    name: 'portugal-districts.geojson',
    candidates: [
      'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/portugal-districts/exports/geojson?lang=en&timezone=UTC',
      'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-portugal-district/exports/geojson?lang=en&timezone=UTC',
      'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/portugal-districts.geojson',
    ],
  },
]

function fetchToFile(url, file) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume() // drain
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const chunks = []
      res.on('data', (d) => chunks.push(d))
      res.on('end', () => {
        try {
          const buf = Buffer.concat(chunks)
          const text = buf.toString('utf8')
          const json = JSON.parse(text)
          if (!json || json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
            return reject(new Error('Not a GeoJSON FeatureCollection'))
          }
          fs.writeFileSync(file, JSON.stringify(json))
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  for (const t of targets) {
    const out = path.join(outDir, t.name)
    let ok = false
    for (const url of t.candidates) {
      process.stdout.write(`Fetching ${t.name} from ${url} ... `)
      try {
        await fetchToFile(url, out)
        console.log('ok')
        ok = true
        break
      } catch (e) {
        console.log('failed:', e.message)
      }
    }
    if (!ok) {
      console.error(`All sources failed for ${t.name}. Please download manually and place it at ${out}`)
      process.exitCode = 1
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

