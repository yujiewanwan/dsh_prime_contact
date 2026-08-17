import type { IncomingMessage, ServerResponse } from 'node:http'

interface WebServer {
  register(route: { kind: 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }): () => void
}

interface PluginContext {
  webServer: WebServer
  effect(dispose: () => void, name: string): void
}

export const inject = ['webServer']

const API_PREFIX = '/plugins/prime-sale-reach/api'
const DEFAULT_BASE_URL = 'http://wechat-sale.aizee.cc'

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

function dashboardPath(pathname: string): string | undefined {
  const suffix = pathname.slice(API_PREFIX.length)
  if (suffix === '/accounts') return '/api/v1/dashboard/accounts'
  if (/^\/accounts\/\d+$/.test(suffix)) return `/api/v1/dashboard${suffix}`
  if (/^\/accounts\/\d+\/conversations\/\d+\/messages$/.test(suffix)) return `/api/v1/dashboard${suffix}`
  return undefined
}

export function apply(ctx: PluginContext): void {
  const baseUrl = (process.env.PRIME_SALE_REACH_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '')
  const token = process.env.PRIME_SALE_REACH_TOKEN
  ctx.effect(ctx.webServer.register({
    kind: 'prefix',
    path: API_PREFIX,
    async handler(req, res): Promise<void> {
      const pathname = new URL(req.url ?? '/', 'http://dsh.local').pathname
      const path = dashboardPath(pathname)
      if (req.method !== 'GET' || path === undefined) {
        sendJson(res, 404, { error: 'Not found' })
        return
      }
      if (token === undefined || token === '') {
        sendJson(res, 503, { error: 'Prime Sale Reach is not configured.' })
        return
      }
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        })
        if (!response.ok) {
          sendJson(res, response.status === 401 || response.status === 403 ? response.status : 502, {
            error: response.status === 401 || response.status === 403 ? 'Prime Sale Reach authorization failed.' : 'Prime Sale Reach request failed.',
          })
          return
        }
        sendJson(res, 200, await response.json())
      } catch {
        sendJson(res, 502, { error: 'Prime Sale Reach is unavailable.' })
      }
    },
  }), 'prime-sale-reach dashboard API')
}
