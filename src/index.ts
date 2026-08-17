import type { IncomingMessage, ServerResponse } from 'node:http'

interface WebServer { register(route: { kind: 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }): () => void }
interface PluginContext { webServer: WebServer; effect(setup: () => () => void, name: string): void }
export const inject = ['webServer']
const PREFIX = '/plugins/prime-contact/api'
const allowed = [/^\/wechat-conversations\/accounts(?:\/\d+\/conversations(?:\/\d+\/messages)?)?$/, /^\/wechat-touch\/daily-todo(?:\/summary)?$/]
function send(res: ServerResponse, status: number, data: unknown): void { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)) }
export function apply(ctx: PluginContext): void {
  const base = (process.env.PRIME_CONTACT_BASE_URL ?? 'http://127.0.0.1:9001').replace(/\/$/, '')
  let token = process.env.PRIME_CONTACT_TOKEN
  const username = process.env.PRIME_CONTACT_USERNAME
  const password = process.env.PRIME_CONTACT_PASSWORD
  const resolveToken = async (): Promise<string | undefined> => {
    if (token) return token
    if (!username || !password) return undefined
    const response = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }), signal: AbortSignal.timeout(10_000) })
    if (!response.ok) return undefined
    const body = await response.json() as { data?: { token?: string } }
    token = body.data?.token
    return token
  }
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: PREFIX, async handler(req, res) {
    const url = new URL(req.url ?? '/', 'http://dsh.local'); const path = url.pathname.slice(PREFIX.length)
    if (req.method !== 'GET' || !allowed.some(rule => rule.test(path))) return send(res, 404, { error: 'Not found' })
    try { const accessToken = await resolveToken(); if (!accessToken) return send(res, 503, { error: 'Prime Contact is not configured.' }); const response = await fetch(`${base}/api${path}${url.search}`, { headers: { authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10_000) }); if (!response.ok) return send(res, response.status < 500 ? response.status : 502, { error: 'Prime Contact request failed.' }); send(res, 200, await response.json()) } catch { send(res, 502, { error: 'Prime Contact is unavailable.' }) }
  } }), 'prime-contact API proxy')
}
