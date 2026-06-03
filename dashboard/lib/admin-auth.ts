export const ADMIN_COOKIE = 'eseyasa_admin_auth'

export function isAdminPassword(password?: string) {
  return Boolean(password && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD)
}

export function parseCookieHeader(cookieHeader?: string) {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach((part) => {
    const index = part.indexOf('=')
    if (index === -1) return
    const key = decodeURIComponent(part.slice(0, index).trim())
    const value = decodeURIComponent(part.slice(index + 1).trim())
    cookies[key] = value
  })

  return cookies
}

export function getAdminPasswordFromCookieHeader(cookieHeader?: string) {
  return parseCookieHeader(cookieHeader)[ADMIN_COOKIE]
}
