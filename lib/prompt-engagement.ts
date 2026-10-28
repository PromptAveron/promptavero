export interface PromptEngagementCounts {
  likeCount: number
  copyCount: number
}

interface PendingRequest {
  promise: Promise<PromptEngagementCounts>
  resolve: (counts: PromptEngagementCounts) => void
  reject: (error: Error) => void
}

const maxSlugsPerRequest = 50
const pendingRequests = new Map<string, PendingRequest>()
const inFlightRequests = new Map<string, Promise<PromptEngagementCounts>>()
let flushTimer: ReturnType<typeof setTimeout> | undefined

function isEngagementCounts(value: unknown): value is PromptEngagementCounts {
  return (
    typeof value === 'object'
    && value !== null
    && 'likeCount' in value
    && 'copyCount' in value
    && typeof value.likeCount === 'number'
    && typeof value.copyCount === 'number'
    && Number.isInteger(value.likeCount)
    && Number.isInteger(value.copyCount)
  )
}

async function loadEngagementBatch(slugs: string[], requests: PendingRequest[]) {
  try {
    const query = new URLSearchParams()
    slugs.forEach((slug) => query.append('slug', slug))
    const response = await fetch(`/api/prompts/engagement/?${query}`, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Could not load prompt counts (${response.status}).`)
    }

    const data: unknown = await response.json()
    if (typeof data !== 'object' || data === null || !('counts' in data) || typeof data.counts !== 'object' || data.counts === null) {
      throw new Error('The prompt counts response was invalid.')
    }

    const counts = new Map<string, PromptEngagementCounts>()
    for (const [slug, value] of Object.entries(data.counts)) {
      if (isEngagementCounts(value)) counts.set(slug, value)
    }

    slugs.forEach((slug, index) => {
      const request = requests[index]
      const result = counts.get(slug)
      if (!result) {
        request.reject(new Error(`The prompt count response was invalid for "${slug}".`))
      } else {
        request.resolve(result)
      }
      inFlightRequests.delete(slug)
    })
  } catch (error) {
    const requestError = error instanceof Error ? error : new Error('Could not load prompt counts.')
    slugs.forEach((slug, index) => {
      requests[index].reject(requestError)
      inFlightRequests.delete(slug)
    })
  }
}

function flushPendingRequests() {
  flushTimer = undefined
  const slugs = [...pendingRequests.keys()].slice(0, maxSlugsPerRequest)
  if (slugs.length === 0) return

  const requests = slugs.map((slug) => {
    const request = pendingRequests.get(slug)
    if (!request) throw new Error(`Prompt count request for "${slug}" was not queued.`)
    pendingRequests.delete(slug)
    inFlightRequests.set(slug, request.promise)
    return request
  })

  void loadEngagementBatch(slugs, requests)
  if (pendingRequests.size > 0) flushTimer = setTimeout(flushPendingRequests, 0)
}

export function fetchPromptEngagement(slug: string): Promise<PromptEngagementCounts> {
  const inFlight = inFlightRequests.get(slug)
  if (inFlight) return inFlight

  const pending = pendingRequests.get(slug)
  if (pending) return pending.promise

  let resolve!: PendingRequest['resolve']
  let reject!: PendingRequest['reject']
  const promise = new Promise<PromptEngagementCounts>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  pendingRequests.set(slug, { promise, resolve, reject })
  if (!flushTimer) flushTimer = setTimeout(flushPendingRequests, 0)
  return promise
}
