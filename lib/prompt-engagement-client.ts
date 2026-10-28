const visitorIdKey = 'promptavero:engagement-visitor'
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getEngagementVisitorId() {
  const savedId = localStorage.getItem(visitorIdKey)
  if (savedId && uuidPattern.test(savedId)) return savedId

  const visitorId = crypto.randomUUID()
  localStorage.setItem(visitorIdKey, visitorId)
  return visitorId
}
