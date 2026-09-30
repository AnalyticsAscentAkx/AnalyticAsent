// CM Optimiser — the worker thread.
//
// The catalogue, the tuned weights and the matching all live here, off the main
// thread, so typing in the form never stutters while 4,000 parts are being
// ranked. It is also the clearest possible statement of the privacy promise:
// there is no fetch to a backend in this file because there is no backend.

import { AlloyTable, decodeCatalogue } from '@/lib/cm/catalogue'
import { Engine } from '@/lib/cm/match'
import type { AlloyGrade, Model, Part } from '@/lib/cm/types'

let engine: Engine | null = null
let alloys: AlloyTable | null = null
let model: Model | null = null
let catalogue: Part[] = []

type InMessage =
  | { type: 'init'; base: string }
  | {
      type: 'match'
      parts: Part[]
      mode: 'raw' | 'enriched'
      available?: string[][]
      k?: number
    }
  | { type: 'catalogue'; parts: Part[] }

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data
  try {
    if (msg.type === 'init') {
      const t0 = performance.now()
      const [catBlob, alloyBlob, modelBlob] = await Promise.all([
        fetch(`${msg.base}/catalogue.json`).then((r) => r.json()),
        fetch(`${msg.base}/alloys.json`).then((r) => r.json()),
        fetch(`${msg.base}/model.json`).then((r) => r.json()),
      ])
      catalogue = decodeCatalogue(catBlob)
      alloys = new AlloyTable(alloyBlob.grades as AlloyGrade[])
      model = modelBlob as Model
      engine = new Engine(catalogue, model, alloys)
      self.postMessage({
        type: 'ready',
        model,
        grades: alloyBlob.grades,
        loadMs: Math.round(performance.now() - t0),
        nCatalogue: catalogue.length,
      })
      return
    }

    if (msg.type === 'catalogue') {
      // Someone uploaded their own history. It replaces the sample entirely and
      // is never merged with it, so a result can never be half their data.
      if (!model || !alloys) throw new Error('engine not ready')
      catalogue = msg.parts
      engine = new Engine(catalogue, model, alloys)
      self.postMessage({ type: 'catalogue-ready', nCatalogue: catalogue.length })
      return
    }

    if (msg.type === 'match') {
      if (!engine) throw new Error('engine not ready')
      const t0 = performance.now()
      const results = msg.parts.map((p, i) =>
        engine!.query(p, {
          k: msg.k ?? 10,
          mode: msg.mode,
          available: msg.available?.[i] ? new Set(msg.available[i]) : undefined,
        }),
      )
      self.postMessage({
        type: 'results',
        results,
        elapsedMs: Math.round(performance.now() - t0),
      })
      return
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

export {}
