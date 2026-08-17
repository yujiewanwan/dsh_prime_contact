const API = '/plugins/prime-sale-reach/api'
const ACTIVE = 'data-prime-sale-reach-active'
const ENTRY = '[data-prime-sale-reach-entry]'
const VIEW = '[data-prime-sale-reach-view]'

type Account = { id: number; displayName: string }
type Conversation = { id: number; type: 'PRIVATE' | 'GROUP'; displayName: string; lastMessageAt: number | null; lastMessageSummary: string | null }
type Overview = { conversations: Conversation[]; activity: Array<{ date: string; count: number }> }
type Message = { id: number; senderName: string | null; direction: string; messageType: string; content: string | null; sentAt: number; mediaUrl: string | null; mediaContentType: string | null; mediaFilename: string | null }

function css(): void {
  if (document.querySelector('style[data-prime-sale-reach-css]')) return
  const tag = document.createElement('style')
  tag.dataset.primeSaleReachCss = ''
  tag.textContent = `html[${ACTIVE}] [data-pane="conversation"]>*:not([data-prime-sale-reach-view]),html[${ACTIVE}] [class*="centerCol"]>*:not([data-prime-sale-reach-view]){display:none!important}.psr-entry{margin:6px 10px;width:calc(100% - 20px);padding:9px 11px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;cursor:pointer}.psr-entry[data-active]{background:rgba(90,140,255,.18)}.psr-view{display:none;height:100%;overflow:auto;background:var(--dsh-bg,#111827);color:var(--dsh-fg,#e5e7eb);padding:24px;box-sizing:border-box}.psr-view[data-open]{display:block}.psr-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.psr-grid{display:grid;grid-template-columns:minmax(280px,1fr) 2fr;gap:16px;margin-top:18px}.psr-card{background:rgba(255,255,255,.06);border-radius:12px;padding:16px}.psr-list{max-height:58vh;overflow:auto}.psr-row{display:block;width:100%;border:0;border-bottom:1px solid rgba(255,255,255,.08);background:none;color:inherit;text-align:left;padding:10px;cursor:pointer}.psr-row:hover{background:rgba(255,255,255,.06)}.psr-msg{margin:10px 0;padding:10px;border-radius:8px;background:rgba(255,255,255,.06)}.psr-msg.out{background:rgba(59,130,246,.2)}.psr-error{color:#fca5a5}.psr-bar{height:8px;background:#60a5fa;border-radius:4px;margin:4px 0}.psr-tabs button{margin-right:6px}`
  document.head.append(tag)
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? '没有访问该看板的权限。' : response.status === 503 ? '请在 DSH 宿主进程配置 PRIME_SALE_REACH_TOKEN。' : '服务暂不可用，请稍后重试。')
  return response.json() as Promise<T>
}

function date(seconds: number | null): string { return seconds === null ? '' : new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }).format(new Date(seconds * 1000)) }

export function apply(): void {
  if (document.querySelector(ENTRY)) return
  css()
  const entry = document.createElement('button')
  entry.type = 'button'; entry.className = 'psr-entry'; entry.dataset.primeSaleReachEntry = ''; entry.textContent = '微信聊天看板'
  const view = document.createElement('section')
  view.className = 'psr-view'; view.dataset.primeSaleReachView = ''
  let accountId: number | undefined; let overview: Overview | undefined; let type: 'PRIVATE' | 'GROUP' = 'PRIVATE'
  const render = (): void => {
    if (!overview) return
    const conversations = overview.conversations.filter(item => item.type === type)
    const max = Math.max(1, ...overview.activity.map(item => item.count))
    view.innerHTML = `<div class="psr-head"><div><h1>微信聊天看板</h1><p>账号 ${accountId ?? ''} · 最近 90 天消息趋势</p></div><button data-refresh>刷新</button></div><div class="psr-card">${overview.activity.map(item => `<div title="${item.date}: ${item.count} 条"><small>${item.date} · ${item.count}</small><div class="psr-bar" style="width:${Math.max(2, item.count / max * 100)}%"></div></div>`).join('')}</div><div class="psr-grid"><div class="psr-card"><div class="psr-tabs"><button data-type="PRIVATE">单聊</button><button data-type="GROUP">群聊</button></div><div class="psr-list">${conversations.map(item => `<button class="psr-row" data-conversation="${item.id}"><strong>${item.displayName}</strong><br><small>${item.lastMessageSummary ?? '暂无消息摘要'} ${date(item.lastMessageAt)}</small></button>`).join('') || '<p>暂无会话</p>'}</div></div><div class="psr-card"><h2>聊天内容</h2><div data-messages>选择一个会话查看最近 200 条消息。</div></div></div>`
    view.querySelectorAll<HTMLButtonElement>('[data-type]').forEach(button => button.onclick = () => { type = button.dataset.type as 'PRIVATE' | 'GROUP'; render() })
    view.querySelector<HTMLButtonElement>('[data-refresh]')!.onclick = () => void load()
    view.querySelectorAll<HTMLButtonElement>('[data-conversation]').forEach(button => button.onclick = () => void messages(Number(button.dataset.conversation)))
  }
  const messages = async (conversationId: number): Promise<void> => {
    const target = view.querySelector<HTMLElement>('[data-messages]')!; target.textContent = '加载中…'
    try { const rows = await get<Message[]>(`/accounts/${accountId}/conversations/${conversationId}/messages`); target.innerHTML = rows.map(row => `<div class="psr-msg ${['OUT','SENT'].includes(row.direction) ? 'out' : ''}"><small>${row.senderName ?? '未知发送者'} · ${date(row.sentAt)}</small><br>${row.content ?? `[${row.messageType}]`}</div>`).join('') || '暂无消息' } catch (error) { target.textContent = error instanceof Error ? error.message : '加载失败' }
  }
  const load = async (): Promise<void> => { view.innerHTML = '<p>加载中…</p>'; try { const accounts = await get<Account[]>('/accounts'); if (!accounts.length) throw new Error('暂无已同步的微信账号。'); accountId = accounts[0]!.id; overview = await get<Overview>(`/accounts/${accountId}`); render() } catch (error) { view.innerHTML = `<p class="psr-error">${error instanceof Error ? error.message : '加载失败'}</p>` } }
  const place = (): void => { const root = document.querySelector<HTMLElement>('[data-pane="sidebar"], [class*="sidebarCol"]'); const center = document.querySelector<HTMLElement>('[data-pane="conversation"], [class*="centerCol"]'); if (root && !entry.isConnected) root.querySelector('button[class*="newSession"]')?.insertAdjacentElement('afterend', entry); if (center && !view.isConnected) center.append(view) }
  const observer = new MutationObserver(place); observer.observe(document.body, { childList: true, subtree: true }); place()
  entry.onclick = () => { const open = !view.hasAttribute('data-open'); if (open) { view.dataset.open = ''; entry.dataset.active = ''; document.documentElement.dataset.primeSaleReachActive = ''; if (!overview) void load() } else { view.removeAttribute('data-open'); delete entry.dataset.active; delete document.documentElement.dataset.primeSaleReachActive } }
}
