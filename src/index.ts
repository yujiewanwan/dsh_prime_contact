import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

interface WebServer { register(route: { kind: 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }): () => void }
interface PluginContext extends Context { webServer: WebServer; credentials: { resolve(ref: string): Promise<{ value: string } | undefined> } }
export const inject = ['webServer', 'credentials', 'tools']
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
const TOOL_TIMEOUT_MS = 10_000
const MAX_TOOL_RESULTS = 50

type PrimeConnection = { base: string; token: string }
type TouchItem = {
  id: number
  batchDate?: string
  actualCompanyName?: string
  sourceName?: string
  contactValue?: string
  wechatId?: string
  wechatNickname?: string
  wechatExists?: number
  userName?: string
  username?: string
}
type Conversation = { id: number; type: string; displayName: string; lastMessageAt?: number | null; lastMessageSummary?: string }
function send(res: ServerResponse, status: number, data: unknown): void { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)) }

function today(): string { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date()) }
function limit(value: unknown): number {
  if (value === undefined) return 20
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > MAX_TOOL_RESULTS) throw new Error(`limit must be an integer between 1 and ${MAX_TOOL_RESULTS}.`)
  return value
}
function textOutput(value: unknown): Array<{ type: 'text'; text: string }> { return [{ type: 'text', text: JSON.stringify(value) }] }

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
  const resolveConnection = async (signal?: AbortSignal): Promise<PrimeConnection | undefined> => {
    const [configuredBase, username, password] = await Promise.all([
      ctx.credentials.resolve(BASE_URL_REF),
      ctx.credentials.resolve(USERNAME_REF),
      ctx.credentials.resolve(PASSWORD_REF),
    ])
    if (!username || !password) return undefined
    const base = (configuredBase?.value || DEFAULT_BASE_URL).replace(/\/$/, '')
    let apiBase = base
    const loginUrl = new URL('/api/auth/login', base)
    const request = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: username.value, password: password.value }), signal: signal === undefined ? AbortSignal.timeout(TOOL_TIMEOUT_MS) : AbortSignal.any([signal, AbortSignal.timeout(TOOL_TIMEOUT_MS)]) } as const
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

  const requestPrime = async <T>(connection: PrimeConnection, path: string, signal: AbortSignal): Promise<T> => {
    const response = await fetch(`${connection.base}/api${path}`, {
      headers: { authorization: `Bearer ${connection.token}` },
      signal: AbortSignal.any([signal, AbortSignal.timeout(TOOL_TIMEOUT_MS)]),
    })
    if (!response.ok) throw new Error('Prime Contact request failed.')
    return await response.json() as T
  }

  ctx.tools.register(defineTool({
    name: 'prime_contact_today_touch',
    description: 'Read Prime Contact WeChat touch-follow-up items. Use this for natural-language requests such as "今天未搜索微信的客户" or "今天已搜索微信的触达". Filter by WeChat-search status and an optional keyword over company, contact information, WeChat ID, and nickname. This tool is read-only.',
    parameters: {
      date: { type: 'string', description: 'Date in YYYY-MM-DD format. Defaults to today in China Standard Time.' },
      wechatSearchStatus: { type: 'string', enum: ['ALL', 'SEARCHED', 'NOT_SEARCHED', 'UNSET'], description: 'ALL returns every touch item. SEARCHED means WeChat search completed successfully; NOT_SEARCHED means it was searched but not found; UNSET means no search result has been recorded. Defaults to ALL.' },
      query: { type: 'string', description: 'Optional keyword matched against company, contact value, WeChat ID, or WeChat nickname.' },
      limit: { type: 'integer', description: `Maximum number of items to return, from 1 to ${MAX_TOOL_RESULTS}. Defaults to 20.` },
    },
    output: {
      schema: {
        type: 'object', additionalProperties: false, properties: {
          date: { type: 'string', required: true },
          total: { type: 'integer', required: true },
          items: {
            type: 'array', required: true, items: {
              type: 'object', additionalProperties: false, properties: {
                id: { type: 'integer', required: true },
                companyName: { type: 'string', required: true },
                contactValue: { type: 'string', required: true },
                wechatId: { type: 'string', required: true },
                wechatNickname: { type: 'string', required: true },
                wechatExists: { oneOf: [{ type: 'integer' }, { type: 'null' }], required: true },
                assignee: { type: 'string', required: true },
              },
            },
          },
        },
      },
      render: (_args, value) => textOutput(value),
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    async execute(args, exec) {
      const date = args.date === undefined ? today() : String(args.date)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must use YYYY-MM-DD format.')
      const resultLimit = limit(args.limit)
      const wechatSearchStatus = args.wechatSearchStatus ?? 'ALL'
      if (!['ALL', 'SEARCHED', 'NOT_SEARCHED', 'UNSET'].includes(wechatSearchStatus)) throw new Error('wechatSearchStatus must be ALL, SEARCHED, NOT_SEARCHED, or UNSET.')
      const query = typeof args.query === 'string' ? args.query.trim().toLocaleLowerCase() : ''
      const connection = await resolveConnection(exec.signal)
      if (!connection) throw new Error('Prime Contact is not configured.')
      const params = new URLSearchParams({ date, page: '1', size: String(MAX_TOOL_RESULTS) })
      if (wechatSearchStatus === 'SEARCHED') params.set('wechatExists', '1')
      if (wechatSearchStatus === 'NOT_SEARCHED') params.set('wechatExists', '0')
      const page = await requestPrime<{ content?: TouchItem[]; totalElements?: number }>(connection, `/wechat-touch/items?${params}`, exec.signal)
      const filtered = (page.content ?? [])
        .filter(item => wechatSearchStatus !== 'UNSET' || item.wechatExists == null)
        .filter(item => !query || [item.actualCompanyName, item.sourceName, item.contactValue, item.wechatId, item.wechatNickname].some(value => value?.toLocaleLowerCase().includes(query)))
      const items = filtered.slice(0, resultLimit).map(item => ({
        id: item.id,
        companyName: item.actualCompanyName ?? item.sourceName ?? '',
        contactValue: item.contactValue ?? '',
        wechatId: item.wechatId ?? '',
        wechatNickname: item.wechatNickname ?? '',
        wechatExists: item.wechatExists === 0 || item.wechatExists === 1 ? item.wechatExists : null,
        assignee: item.userName ?? item.username ?? '',
      }))
      return { date, total: filtered.length, items }
    },
    presentCall: () => ({ card: 'generic', title: '查询今日触达跟进', kind: 'read' }),
  }))

  ctx.tools.register(defineTool({
    name: 'prime_contact_search_wechat_conversations',
    description: 'Search Prime Contact WeChat conversations by participant name or latest-message text. Use this to find relevant direct or group conversations before discussing follow-up context. This tool is read-only and returns conversation summaries, not full message history.',
    parameters: {
      query: { type: 'string', required: true, description: 'Participant name or text to search for.' },
      conversationType: { type: 'string', enum: ['DIRECT', 'GROUP', 'ALL'], description: 'Filter by direct chat, group chat, or all chats. Defaults to ALL.' },
      limit: { type: 'integer', description: `Maximum number of conversations to return, from 1 to ${MAX_TOOL_RESULTS}. Defaults to 20.` },
    },
    output: {
      schema: {
        type: 'object', additionalProperties: false, properties: {
          total: { type: 'integer', required: true },
          conversations: {
            type: 'array', required: true, items: {
              type: 'object', additionalProperties: false, properties: {
                id: { type: 'integer', required: true },
                type: { type: 'string', required: true },
                displayName: { type: 'string', required: true },
                lastMessageAt: { oneOf: [{ type: 'number' }, { type: 'null' }], required: true },
                lastMessageSummary: { type: 'string', required: true },
              },
            },
          },
        },
      },
      render: (_args, value) => textOutput(value),
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    async execute(args, exec) {
      const query = String(args.query).trim()
      if (!query) throw new Error('query must not be empty.')
      const resultLimit = limit(args.limit)
      const conversationType = args.conversationType ?? 'ALL'
      const connection = await resolveConnection(exec.signal)
      if (!connection) throw new Error('Prime Contact is not configured.')
      const accounts = await requestPrime<Array<{ id: number }>>(connection, '/wechat-conversations/accounts', exec.signal)
      const accountId = accounts[0]?.id
      if (!accountId) throw new Error('No accessible WeChat account is available.')
      const overview = await requestPrime<{ conversations?: Conversation[] }>(connection, `/wechat-conversations/accounts/${accountId}/conversations`, exec.signal)
      const normalizedQuery = query.toLocaleLowerCase()
      const conversations = (overview.conversations ?? [])
        .filter(item => conversationType === 'ALL' || (conversationType === 'GROUP' ? item.type === 'GROUP' : item.type !== 'GROUP'))
        .filter(item => `${item.displayName} ${item.lastMessageSummary ?? ''}`.toLocaleLowerCase().includes(normalizedQuery))
        .sort((left, right) => (right.lastMessageAt ?? 0) - (left.lastMessageAt ?? 0))
      return {
        total: conversations.length,
        conversations: conversations.slice(0, resultLimit).map(item => ({
          id: item.id,
          type: item.type,
          displayName: item.displayName,
          lastMessageAt: item.lastMessageAt ?? null,
          lastMessageSummary: item.lastMessageSummary ?? '',
        })),
      }
    },
    presentCall: () => ({ card: 'generic', title: '搜索微信会话', kind: 'read' }),
  }))

  ctx.tools.register(defineTool({
    name: 'prime_contact_read_wechat_messages',
    description: 'Read recent messages from one Prime Contact WeChat conversation. Use prime_contact_search_wechat_conversations first when the conversation ID is unknown. This tool is read-only.',
    parameters: {
      conversationId: { type: 'integer', required: true, description: 'Conversation ID returned by prime_contact_search_wechat_conversations.' },
      limit: { type: 'integer', description: `Maximum number of recent messages to return, from 1 to ${MAX_TOOL_RESULTS}. Defaults to 20.` },
    },
    output: {
      schema: {
        type: 'object', additionalProperties: false, properties: {
          conversationId: { type: 'integer', required: true },
          messages: {
            type: 'array', required: true, items: {
              type: 'object', additionalProperties: false, properties: {
                id: { type: 'integer', required: true },
                senderName: { type: 'string', required: true },
                direction: { type: 'string', required: true },
                messageType: { type: 'string', required: true },
                content: { type: 'string', required: true },
                sentAt: { type: 'number', required: true },
              },
            },
          },
        },
      },
      render: (_args, value) => textOutput(value),
    },
    timeoutMs: TOOL_TIMEOUT_MS,
    async execute(args, exec) {
      const conversationId = args.conversationId
      if (typeof conversationId !== 'number' || !Number.isSafeInteger(conversationId) || conversationId < 1) throw new Error('conversationId must be a positive integer.')
      const resultLimit = limit(args.limit)
      const connection = await resolveConnection(exec.signal)
      if (!connection) throw new Error('Prime Contact is not configured.')
      const accounts = await requestPrime<Array<{ id: number }>>(connection, '/wechat-conversations/accounts', exec.signal)
      const accountId = accounts[0]?.id
      if (!accountId) throw new Error('No accessible WeChat account is available.')
      const messages = await requestPrime<Array<{ id: number; senderName?: string; direction?: string; messageType?: string; content?: string; sentAt?: number }>>(connection, `/wechat-conversations/accounts/${accountId}/conversations/${conversationId}/messages`, exec.signal)
      return {
        conversationId,
        messages: messages.slice(-resultLimit).map(message => ({
          id: message.id,
          senderName: message.senderName ?? '',
          direction: message.direction ?? '',
          messageType: message.messageType ?? '',
          content: message.content ?? '',
          sentAt: message.sentAt ?? 0,
        })),
      }
    },
    presentCall: () => ({ card: 'generic', title: '读取微信聊天内容', kind: 'read' }),
  }))

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
