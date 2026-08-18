import type { IncomingMessage, ServerResponse } from 'node:http'

interface WebServer { register(route: { kind: 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }): () => void }
interface PluginContext { webServer: WebServer; credentials: { resolve(ref: string): Promise<{ value: string } | undefined> }; effect(setup: () => () => void, name: string): void }
export const inject = ['webServer', 'credentials']
const PREFIX = '/plugins/prime-contact/api'
const USERNAME_REF = 'PRIME_CONTACT_USERNAME'
const PASSWORD_REF = 'PRIME_CONTACT_PASSWORD'
const BASE_URL_REF = 'PRIME_CONTACT_BASE_URL'
const DEFAULT_BASE_URL = 'http://127.0.0.1:9001'
const readablePaths = [
  /^\/wechat-conversations\/accounts(?:\/\d+\/conversations(?:\/\d+\/messages)?)?$/,
  /^\/wechat-touch\/items$/,
]
const itemUpdatePath = /^\/wechat-touch\/items\/\d+$/
function send(res: ServerResponse, status: number, data: unknown): void { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)) }

async function readItemUpdate(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let length = 0
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    length += bytes.length
    if (length > 8_192) throw new Error('Request body is too large.')
    chunks.push(bytes)
  }
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
  const update: Record<string, string | number | null> = {}
  if (payload.wechatExists === 0 || payload.wechatExists === 1 || payload.wechatExists === null) update.wechatExists = payload.wechatExists
  if (typeof payload.wechatNickname === 'string') update.wechatNickname = payload.wechatNickname.slice(0, 100)
  if (payload.wechatNickname === null) update.wechatNickname = null
  if (Object.keys(update).length === 0) throw new Error('No supported update fields.')
  return JSON.stringify(update)
}
export function apply(ctx: PluginContext): void {
  const resolveConnection = async (): Promise<{ base: string; token: string } | undefined> => {
    const [configuredBase, username, password] = await Promise.all([
      ctx.credentials.resolve(BASE_URL_REF),
      ctx.credentials.resolve(USERNAME_REF),
      ctx.credentials.resolve(PASSWORD_REF),
    ])
    if (!username || !password) return undefined
    const base = (configuredBase?.value || DEFAULT_BASE_URL).replace(/\/$/, '')
    let apiBase = base
    const loginUrl = new URL('/api/auth/login', base)
    const request = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: username.value, password: password.value }), signal: AbortSignal.timeout(10_000) } as const
    let response = await fetch(loginUrl, { ...request, redirect: 'manual' })
    if ([301, 302, 307, 308].includes(response.status)) {
      const redirectedUrl = new URL(response.headers.get('location') ?? '', loginUrl)
      if (redirectedUrl.hostname !== loginUrl.hostname || redirectedUrl.protocol !== 'https:') return undefined
      response = await fetch(redirectedUrl, request)
      apiBase = redirectedUrl.origin
    }
    if (!response.ok) return undefined
    const body = await response.json() as { data?: { token?: string } }
    return body.data?.token ? { base: apiBase, token: body.data.token } : undefined
  }
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: PREFIX, async handler(req, res) {
    const url = new URL(req.url ?? '/', 'http://dsh.local')
    const path = url.pathname.slice(PREFIX.length)
    const isRead = req.method === 'GET' && readablePaths.some(rule => rule.test(path))
    const isUpdate = req.method === 'PUT' && itemUpdatePath.test(path)
    if (!isRead && !isUpdate) return send(res, 404, { error: 'Not found' })

    let requestBody: string | undefined
    if (isUpdate) {
      try {
        requestBody = await readItemUpdate(req)
      } catch {
        return send(res, 400, { error: 'Invalid item update.' })
      }
    }

    try {
      const connection = await resolveConnection()
      if (!connection) return send(res, 503, { error: 'Prime Contact is not configured.' })
      const response = await fetch(`${connection.base}/api${path}${url.search}`, {
        method: req.method,
        headers: { authorization: `Bearer ${connection.token}`, ...(isUpdate ? { 'content-type': 'application/json' } : {}) },
        body: requestBody,
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) return send(res, response.status < 500 ? response.status : 502, { error: 'Prime Contact request failed.' })
      send(res, 200, await response.json())
    } catch {
      send(res, 502, { error: 'Prime Contact is unavailable.' })
    }
  } }), 'prime-contact API proxy')
}
