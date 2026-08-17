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
  tag.textContent = `html[${ACTIVE}] [data-pane="conversation"]>*:not([data-prime-sale-reach-view]),html[${ACTIVE}] [class*="centerCol"]>*:not([data-prime-sale-reach-view]){display:none!important}.psr-entry{margin:4px 10px;width:calc(100% - 20px);padding:8px 10px;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer}.psr-entry[data-active],.psr-entry:hover{background:color-mix(in srgb,currentColor 10%,transparent)}.psr-view{display:none;height:100%;overflow:hidden;background:var(--background,#111);color:var(--foreground,#e5e5e5);box-sizing:border-box}.psr-view[data-open]{display:flex;flex-direction:column}.psr-head{height:56px;padding:0 20px;border-bottom:1px solid color-mix(in srgb,currentColor 14%,transparent);display:flex;justify-content:space-between;align-items:center}.psr-head h1{font-size:16px;margin:0}.psr-head p{display:none}.psr-head button,.psr-tabs button{font:inherit;color:inherit;background:transparent;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:6px;padding:5px 9px;cursor:pointer}.psr-grid{display:grid;grid-template-columns:minmax(270px,32%) 1fr;flex:1;min-height:0}.psr-card{min-width:0;padding:0}.psr-grid .psr-card:first-child{border-right:1px solid color-mix(in srgb,currentColor 14%,transparent)}.psr-tabs{padding:12px;border-bottom:1px solid color-mix(in srgb,currentColor 14%,transparent)}.psr-tabs button{margin-right:6px}.psr-list{height:calc(100vh - 128px);overflow:auto}.psr-row{display:block;width:100%;border:0;border-bottom:1px solid color-mix(in srgb,currentColor 8%,transparent);background:transparent;color:inherit;text-align:left;padding:11px 14px;font:inherit;cursor:pointer}.psr-row:hover{background:color-mix(in srgb,currentColor 7%,transparent)}.psr-row strong{font-size:13px}.psr-row small{display:block;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.65}.psr-grid .psr-card:last-child{display:flex;flex-direction:column}.psr-grid h2{font-size:14px;margin:0;padding:15px 16px;border-bottom:1px solid color-mix(in srgb,currentColor 14%,transparent)}[data-messages]{padding:14px 16px;overflow:auto}.psr-msg{max-width:75%;margin:10px 0;padding:9px 11px;border-radius:8px;background:color-mix(in srgb,currentColor 8%,transparent);font-size:13px;line-height:1.5}.psr-msg.out{margin-left:auto;background:color-mix(in srgb,#3b82f6 24%,transparent)}.psr-msg small{opacity:.62}.psr-error{padding:20px;color:#dc2626}`
  tag.textContent += `.psr-view{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}.psr-entry[data-active],.psr-entry:hover,.psr-row:hover{background:var(--dsw-alias-interactive-bg-hover)}.psr-head,.psr-tabs,.psr-grid .psr-card:first-child,.psr-grid h2{border-color:var(--dsw-alias-border-l2)}.psr-head button,.psr-tabs button{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}.psr-row{border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}.psr-row small,.psr-msg small{color:var(--dsw-alias-label-tertiary);opacity:1}.psr-msg{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}.psr-msg.out{background:var(--dsw-alias-interactive-bg-hover-solid)}.psr-error{color:var(--dsw-alias-state-error-primary)}`
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
    view.innerHTML = `<div class="psr-head"><div><h1>微信聊天</h1><p>账号 ${accountId ?? ''}</p></div><button data-refresh>刷新</button></div><div class="psr-grid"><div class="psr-card"><div class="psr-tabs"><button data-type="PRIVATE">单聊</button><button data-type="GROUP">群聊</button></div><div class="psr-list">${conversations.map(item => `<button class="psr-row" data-conversation="${item.id}"><strong>${item.displayName}</strong><small>${item.lastMessageSummary ?? '暂无消息摘要'} ${date(item.lastMessageAt)}</small></button>`).join('') || '<p>暂无会话</p>'}</div></div><div class="psr-card"><h2>聊天内容</h2><div data-messages>选择一个会话查看最近 200 条消息。</div></div></div>`
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
