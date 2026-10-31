const visitorIdKey = 'promptavero:engagement-visitor'
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
let memoryVisitorId: string | undefined

export function getEngagementVisitorId() {
  let savedId: string | null = null
  try {
    savedId = localStorage.getItem(visitorIdKey)
  } catch (error) {
    console.error('Could not read the saved engagement visitor ID.', error)
  }
  if (savedId && uuidPattern.test(savedId)) return savedId
  if (memoryVisitorId) return memoryVisitorId

  const visitorId = crypto.randomUUID()
  memoryVisitorId = visitorId
  try {
    localStorage.setItem(visitorIdKey, visitorId)
  } catch (error) {
    console.error('Could not save the engagement visitor ID; using a session-only ID.', error)
  }
  return visitorId
}
