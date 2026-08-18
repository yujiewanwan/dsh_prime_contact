const API = '/plugins/prime-contact/api'
const ACTIVE = 'data-prime-contact-active'
export const inject = ['slots', 'connection']
type ReactRuntime = {
  createElement: (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => unknown
  useState: <T>(initial: T) => [T, (value: T) => void]
}
declare const require: (name: string) => ReactRuntime
async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`)
  if (!response.ok) throw new Error(response.status === 503 ? '请在设置 > 插件 > 插件配置中完成 Prime Contact 登录。' : 'Prime Contact 请求失败。')
  const body = await response.json() as { data?: T }
  return (body.data ?? body) as T
}
async function put<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API}${path}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  if (!response.ok) throw new Error('保存失败，请稍后重试。')
  const body = await response.json() as { data?: T }
  return (body.data ?? body) as T
}
function html(value: unknown): string { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!) }
function copyButton(value: string): string { return `<button type="button" class="pc-copy" data-copy="${html(value)}">复制</button>` }
function today(): string { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date()) }
function css(): void { if (document.querySelector('style[data-prime-contact-css]')) return; const tag = document.createElement('style'); tag.dataset.primeContactCss = ''; tag.textContent = `html[${ACTIVE}] [data-pane="conversation"]>*:not([data-prime-contact-view]),html[${ACTIVE}] [class*="centerCol"]>*:not([data-prime-contact-view]){display:none!important}.pc-entry{margin:4px 10px;width:calc(100% - 20px);padding:8px 10px;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer}.pc-entry:hover,.pc-entry[data-active],.pc-tabs button[data-active],.pc-row:hover,.pc-subtabs button[data-active]{background:var(--dsw-alias-interactive-bg-hover)}.pc-view{display:none;height:100%;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);overflow:hidden}.pc-view[data-open]{display:flex;flex-direction:column}.pc-head{height:56px;display:flex;align-items:center;padding:0 20px;border-bottom:1px solid var(--dsw-alias-border-l2);gap:16px}.pc-head strong{margin-right:auto}.pc-tabs,.pc-subtabs{display:flex;gap:4px}.pc-tabs button,.pc-subtabs button{border:0;border-radius:6px;padding:6px 9px;background:transparent;color:inherit;font:inherit;cursor:pointer}.pc-body{min-height:0;flex:1;overflow:auto}.pc-split{display:grid;grid-template-columns:32% 1fr;height:100%}.pc-list{overflow:auto;border-right:1px solid var(--dsw-alias-border-l2)}.pc-row{display:block;width:100%;padding:11px 14px;border:0;border-bottom:1px solid var(--dsw-alias-border-l1);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.pc-row small,.pc-note{display:block;margin-top:4px;color:var(--dsw-alias-label-tertiary)}.pc-detail{padding:16px;overflow:auto}.pc-message{max-width:75%;margin:10px 0;padding:9px 11px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-size:13px}.pc-message.out{margin-left:auto;background:var(--dsw-alias-interactive-bg-hover-solid)}.pc-empty{padding:24px;color:var(--dsw-alias-label-tertiary)}.pc-toolbar{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}.pc-touch{padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}.pc-touch-grid{display:grid;grid-template-columns:minmax(120px,1fr) minmax(160px,1.5fr) minmax(160px,1.5fr);gap:12px;margin-top:10px}.pc-field label{display:block;margin-bottom:5px;color:var(--dsw-alias-label-tertiary);font-size:12px}.pc-field input,.pc-field select{box-sizing:border-box;width:100%;padding:7px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit}.pc-save{align-self:end;padding:7px 10px;border:0;border-radius:6px;background:var(--dsw-alias-interactive-bg-hover-solid);color:inherit;font:inherit;cursor:pointer}`; document.head.append(tag) }
function workbenchStyles(): void {
  if (document.querySelector('style[data-prime-contact-workbench]')) return
  const tag = document.createElement('style')
  tag.dataset.primeContactWorkbench = ''
  tag.textContent = `
    .pc-entry{margin:4px 8px;width:calc(100% - 16px);padding:9px 12px;font-size:13px;font-weight:560;letter-spacing:.01em}
    .pc-view{background:var(--dsw-alias-bg-base)}
    .pc-head{height:64px;padding:0 24px;gap:20px;background:var(--dsw-alias-bg-base);box-shadow:0 1px 0 var(--dsw-alias-border-l1)}
    .pc-title{display:flex;align-items:baseline;gap:9px;margin-right:auto}.pc-title strong{margin:0;font-size:15px;letter-spacing:.01em}.pc-title span{color:var(--dsw-alias-label-tertiary);font-size:12px}
    .pc-tabs,.pc-subtabs{gap:2px;padding:3px;border-radius:9px;background:var(--dsw-alias-bg-layer-2)}
    .pc-tabs button,.pc-subtabs button{padding:6px 10px;border-radius:6px;color:var(--dsw-alias-label-secondary);font-size:13px;transition:background .15s,color .15s,box-shadow .15s}
    .pc-tabs button[data-active],.pc-subtabs button[data-active]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px color-mix(in srgb,var(--dsw-alias-label-primary) 12%,transparent)}
    .pc-toolbar{min-height:58px;box-sizing:border-box;padding:10px 20px;gap:12px;background:var(--dsw-alias-bg-base);border-bottom:1px solid var(--dsw-alias-border-l1)}
    .pc-chat-toolbar{position:sticky;top:0;z-index:1}.pc-count{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:12px;white-space:nowrap}
    .pc-search{box-sizing:border-box;min-width:240px;max-width:420px;flex:1;padding:8px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;outline:0;background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit;font-size:13px;transition:border-color .15s,box-shadow .15s}.pc-search:focus{border-color:var(--dsw-alias-interactive-bg-hover-solid);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-interactive-bg-hover-solid) 20%,transparent)}
    .pc-split{grid-template-columns:minmax(300px,380px) minmax(0,1fr);background:var(--dsw-alias-bg-base)}
    .pc-list{background:var(--dsw-alias-bg-layer-2)}.pc-row{position:relative;padding:13px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);transition:background .12s}.pc-row:hover{background:var(--dsw-alias-bg-base)}
    .pc-row-head{display:flex;align-items:center;gap:10px}.pc-conversation-avatar{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary);font-size:11px;font-weight:650}.pc-row-main{min-width:0;flex:1}.pc-row-main b,.pc-row-main small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pc-row-main b{font-size:13px;font-weight:590}.pc-row-main small{margin-top:3px;font-size:12px}.pc-row time{margin-left:auto;align-self:flex-start;color:var(--dsw-alias-label-tertiary);font-size:11px;white-space:nowrap}
    .pc-detail{padding:28px;background:var(--dsw-alias-bg-base)}.pc-message{max-width:min(72%,680px);margin:12px 0;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-2);line-height:1.55}.pc-message small{color:var(--dsw-alias-label-tertiary);font-size:11px}.pc-message.out{border-color:transparent;background:var(--dsw-alias-interactive-bg-hover-solid)}
    .pc-touch-workbench{padding:20px}.pc-touch-toolbar{padding:0 0 14px;border:0}.pc-touch-title{display:flex;align-items:baseline;gap:8px}.pc-touch-title strong{font-size:15px}.pc-touch-title span{color:var(--dsw-alias-label-tertiary);font-size:12px}.pc-touch-table-wrap{overflow:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-base)}
    .pc-touch-table{width:100%;min-width:960px;border-collapse:collapse;font-size:13px}.pc-touch-table th{padding:10px 12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:550;text-align:left;white-space:nowrap}.pc-touch-table td{padding:11px 12px;border-top:1px solid var(--dsw-alias-border-l1);vertical-align:middle}.pc-touch-table tr:hover td{background:color-mix(in srgb,var(--dsw-alias-interactive-bg-hover) 45%,transparent)}.pc-company{max-width:180px;font-weight:580}.pc-copy-value{display:inline-block;max-width:180px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;white-space:nowrap}.pc-copy{margin-left:6px;padding:3px 7px;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer}.pc-copy:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.pc-select,.pc-input{box-sizing:border-box;width:100%;min-width:108px;padding:7px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;outline:0;background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit;font-size:12px}.pc-input{min-width:150px}.pc-select:focus,.pc-input:focus{border-color:var(--dsw-alias-interactive-bg-hover-solid)}.pc-save{padding:7px 12px;border-radius:6px;font-size:12px}.pc-save:disabled{opacity:.65;cursor:wait}
    .pc-empty{padding:32px;color:var(--dsw-alias-label-tertiary)}
    @media (max-width:760px){.pc-head{height:auto;min-height:64px;padding:10px 14px;align-items:flex-start;flex-direction:column;gap:7px}.pc-tabs{width:100%;overflow:auto}.pc-toolbar{padding:10px 14px;flex-wrap:wrap}.pc-search{min-width:0;width:100%;max-width:none;flex-basis:100%}.pc-split{grid-template-columns:1fr;grid-template-rows:44% 56%}.pc-list{border-right:0;border-bottom:1px solid var(--dsw-alias-border-l2)}.pc-touch-workbench{padding:14px}.pc-detail{padding:16px}}
  `
  document.head.append(tag)
}
function installSettings(ctx: any): void {
  const React = require('react')
  const connection = ctx.get('connection') as { api: { credentials: { set: (payload: { ref: string; value: string }) => Promise<unknown> } } }
  const inputStyle = { display: 'block', boxSizing: 'border-box', width: '100%', marginTop: '6px', padding: '8px 10px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '6px', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', font: 'inherit' }
  const labelStyle = { display: 'block', marginTop: '14px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' }
  const SettingsCard = () => {
    const [open, setOpen] = React.useState(false)
    const [baseUrl, setBaseUrl] = React.useState('http://127.0.0.1:9001')
    const [username, setUsername] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [status, setStatus] = React.useState('')
    const save = async (event: any) => {
      event.preventDefault()
      if (!baseUrl.trim() || !username.trim() || !password) {
        setStatus('请填写服务地址、用户名和密码。')
        return
      }
      setStatus('保存中…')
      try {
        await Promise.all([
          connection.api.credentials.set({ ref: 'PRIME_CONTACT_BASE_URL', value: baseUrl.trim().replace(/\/$/, '') }),
          connection.api.credentials.set({ ref: 'PRIME_CONTACT_USERNAME', value: username.trim() }),
          connection.api.credentials.set({ ref: 'PRIME_CONTACT_PASSWORD', value: password }),
        ])
        setPassword('')
        setStatus('已保存。凭据仅由 DSH 受管存储，之后不会再显示。')
      } catch {
        setStatus('保存失败，请确认 DSH 已连接并重试。')
      }
    }
    return React.createElement('li', { style: { listStyle: 'none', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '8px' } },
      React.createElement('button', { type: 'button', onClick: () => setOpen(!open), 'aria-expanded': open, 'aria-label': `${open ? '收起' : '展开'}设置: Prime Contact`, style: { display: 'block', width: '100%', padding: '16px 20px', border: 0, background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' } },
        React.createElement('b', null, 'Prime Contact'),
        React.createElement('span', { style: { display: 'block', marginTop: '4px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' } }, '微信沟通与触达跟进的数据源。'),
      ),
      open ? React.createElement('form', { onSubmit: save, style: { maxWidth: '560px', padding: '0 20px 20px' } },
        React.createElement('h3', { style: { margin: '0 0 4px' } }, 'Prime Contact'),
        React.createElement('p', { style: { margin: '0 0 4px', color: 'var(--dsw-alias-label-secondary)' } }, '用于微信沟通、今日触达跟进等 Prime Contact 数据。'),
        React.createElement('label', { style: labelStyle }, '服务地址', React.createElement('input', { style: inputStyle, value: baseUrl, onChange: (event: any) => setBaseUrl(event.target.value), placeholder: 'http://127.0.0.1:9001' })),
        React.createElement('label', { style: labelStyle }, '用户名', React.createElement('input', { style: inputStyle, value: username, onChange: (event: any) => setUsername(event.target.value), autoComplete: 'username' })),
        React.createElement('label', { style: labelStyle }, '密码', React.createElement('input', { style: inputStyle, type: 'password', value: password, onChange: (event: any) => setPassword(event.target.value), autoComplete: 'current-password' })),
        React.createElement('button', { type: 'submit', style: { marginTop: '18px', padding: '8px 14px', border: 0, borderRadius: '6px', background: 'var(--dsw-alias-interactive-bg-hover-solid)', color: 'var(--dsw-alias-label-primary)', font: 'inherit', cursor: 'pointer' } }, '保存配置'),
        status ? React.createElement('p', { style: { marginTop: '12px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' } }, status) : null,
      ) : null,
    )
  }
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register(
    { name: 'settings.plugin.item', id: 'prime-contact', order: 30 },
    SettingsCard,
  ))
}
function applyLegacy(ctx: any): void { if (document.querySelector('[data-prime-contact-entry]')) return; css(); installSettings(ctx); const entry = document.createElement('button'); entry.className = 'pc-entry'; entry.dataset.primeContactEntry = ''; entry.textContent = '微信沟通'; const view = document.createElement('section'); view.className = 'pc-view'; view.dataset.primeContactView = ''; let tab = 'dashboard'; let accountId: number | undefined
  const render = () => { view.innerHTML = `<header class="pc-head"><strong>微信沟通</strong><nav class="pc-tabs">${[['dashboard','看板'],['followup','今日触达跟进'],['maintenance','今日客户维护'],['chat','聊天管理']].map(([id,name]) => `<button data-tab="${id}" ${tab === id ? 'data-active' : ''}>${name}</button>`).join('')}</nav></header><main class="pc-body"></main>`; view.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button => button.onclick = () => { tab = button.dataset.tab!; void load() }) }
  const load = async () => { render(); const body = view.querySelector<HTMLElement>('.pc-body')!; body.innerHTML = '<p class="pc-empty">加载中…</p>'; try { if (tab === 'chat') { if (!accountId) accountId = (await get<Array<{ id: number }>>('/wechat-conversations/accounts'))[0]?.id; if (!accountId) throw new Error('暂无可访问微信账号。'); const overview = await get<{ conversations: Array<{ id: number; type: string; displayName: string; lastMessageSummary?: string }> }>(`/wechat-conversations/accounts/${accountId}/conversations`); body.innerHTML = `<div class="pc-split"><div class="pc-list">${overview.conversations.map(item => `<button class="pc-row" data-id="${item.id}"><b>${item.type === 'GROUP' ? '群' : '单'} · ${item.displayName}</b><small>${item.lastMessageSummary ?? ''}</small></button>`).join('')}</div><div class="pc-detail">选择一个会话查看聊天记录。</div></div>`; body.querySelectorAll<HTMLButtonElement>('[data-id]').forEach(button => button.onclick = async () => { const detail = body.querySelector<HTMLElement>('.pc-detail')!; const rows = await get<Array<{ senderName?: string; direction: string; content?: string; messageType: string }>>(`/wechat-conversations/accounts/${accountId}/conversations/${button.dataset.id}/messages`); detail.innerHTML = rows.map(row => `<div class="pc-message ${row.direction === 'OUT' ? 'out' : ''}"><small>${row.senderName ?? ''}</small><br>${row.content ?? `[${row.messageType}]`}</div>`).join('') }) } else if (tab === 'followup') { const page = await get<{ content: Array<{ companyName?: string; contactName?: string; contactValue?: string; intentLevel?: string; overdueDays: number }> }>('/wechat-touch/daily-todo?page=1&size=50'); body.innerHTML = page.content.map(item => `<article class="pc-todo"><b>${item.companyName ?? '未关联公司'} · ${item.contactName ?? '未知联系人'}</b><br>${item.contactValue ?? ''} · ${item.intentLevel ?? ''} · 逾期 ${item.overdueDays} 天</article>`).join('') || '<p class="pc-empty">今日暂无触达跟进。</p>' } else body.innerHTML = `<p class="pc-empty">${tab === 'dashboard' ? '早报、晚报将在 Prime Contact 日报持久化接口完成后接入。' : '客户维护规则将在聊天管理基础上接入。'}</p>` } catch (error) { body.innerHTML = `<p class="pc-empty">${error instanceof Error ? error.message : '加载失败'}</p>` } }
  const place = () => { const sidebar = document.querySelector<HTMLElement>('[data-pane="sidebar"], [class*="sidebarCol"]'); const center = document.querySelector<HTMLElement>('[data-pane="conversation"], [class*="centerCol"]'); if (sidebar && !entry.isConnected) sidebar.querySelector('button[class*="newSession"]')?.insertAdjacentElement('afterend', entry); if (center && !view.isConnected) center.append(view) }; new MutationObserver(place).observe(document.body, { childList: true, subtree: true }); place(); entry.onclick = () => { const open = !view.hasAttribute('data-open'); view.toggleAttribute('data-open', open); entry.toggleAttribute('data-active', open); document.documentElement.toggleAttribute(ACTIVE, open); if (open) void load() }
}

type Conversation = { id: number; type: string; displayName: string; lastMessageAt?: number | null; lastMessageSummary?: string }
type TouchItem = { id: number; batchDate?: string; actualCompanyName?: string; sourceName?: string; contactValue?: string; wechatId?: string; wechatNickname?: string; wechatExists?: number; userName?: string; username?: string }

export function apply(ctx: any): void {
  if (document.querySelector('[data-prime-contact-entry]')) return
  css()
  workbenchStyles()
  installSettings(ctx)

  const entry = document.createElement('button')
  entry.className = 'pc-entry'
  entry.dataset.primeContactEntry = ''
  entry.textContent = '微信沟通'

  const view = document.createElement('section')
  view.className = 'pc-view'
  view.dataset.primeContactView = ''
  let tab = 'dashboard'
  let accountId: number | undefined
  let conversationType = 'DIRECT'
  let conversationSearch = ''
  let allConversations: Conversation[] = []

  const render = () => {
    view.innerHTML = `<header class="pc-head"><div class="pc-title"><strong>微信沟通</strong><span>Prime Contact</span></div><nav class="pc-tabs">${[['dashboard', '看板'], ['followup', '今日触达跟进'], ['maintenance', '今日客户维护'], ['chat', '聊天管理']].map(([id, name]) => `<button data-tab="${id}" ${tab === id ? 'data-active' : ''}>${name}</button>`).join('')}</nav></header><main class="pc-body"></main>`
    view.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button => { button.onclick = () => { tab = button.dataset.tab!; void load() } })
  }

  const showMessages = async (conversationId: string) => {
    const detail = view.querySelector<HTMLElement>('.pc-detail')
    if (!detail || !accountId) return
    detail.textContent = '加载聊天记录…'
    try {
      const rows = await get<Array<{ senderName?: string; direction: string; content?: string; messageType: string }>>(`/wechat-conversations/accounts/${accountId}/conversations/${conversationId}/messages`)
      detail.innerHTML = rows.map(row => `<div class="pc-message ${row.direction === 'OUT' ? 'out' : ''}"><small>${html(row.senderName)}</small><br>${html(row.content || `[${row.messageType}]`)}</div>`).join('') || '<p class="pc-empty">暂无消息。</p>'
    } catch (error) {
      detail.textContent = error instanceof Error ? error.message : '加载失败'
    }
  }

  const formatMessageTime = (value?: number | null): string => {
    if (!value) return '暂无消息'
    const timestamp = value < 1_000_000_000_000 ? value * 1_000 : value
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(timestamp))
  }

  const renderConversations = () => {
    const body = view.querySelector<HTMLElement>('.pc-body')!
    const search = conversationSearch.trim().toLocaleLowerCase()
    const conversations = allConversations
      .filter(item => conversationType === 'GROUP' ? item.type === 'GROUP' : item.type !== 'GROUP')
      .filter(item => !search || `${item.displayName} ${item.lastMessageSummary ?? ''}`.toLocaleLowerCase().includes(search))
      .sort((left, right) => (right.lastMessageAt ?? 0) - (left.lastMessageAt ?? 0))
    body.innerHTML = `<div class="pc-toolbar pc-chat-toolbar"><nav class="pc-subtabs"><button data-conversation-type="DIRECT" ${conversationType === 'DIRECT' ? 'data-active' : ''}>单聊</button><button data-conversation-type="GROUP" ${conversationType === 'GROUP' ? 'data-active' : ''}>群聊</button></nav><input class="pc-search" data-conversation-search placeholder="输入关键词后按 Enter 搜索" value="${html(conversationSearch)}"><span class="pc-count">${conversations.length} 个会话</span></div><div class="pc-split"><div class="pc-list">${conversations.map(item => `<button class="pc-row" data-id="${item.id}"><span class="pc-row-head"><span class="pc-conversation-avatar">${item.type === 'GROUP' ? '群' : '单'}</span><span class="pc-row-main"><b>${html(item.displayName)}</b><small>${html(item.lastMessageSummary)}</small></span><time>${formatMessageTime(item.lastMessageAt)}</time></span></button>`).join('') || '<p class="pc-empty">暂无匹配会话。</p>'}</div><div class="pc-detail">选择一个会话查看聊天记录。</div></div>`
    body.querySelectorAll<HTMLButtonElement>('[data-conversation-type]').forEach(button => { button.onclick = () => { conversationType = button.dataset.conversationType!; renderConversations() } })
    body.querySelector<HTMLInputElement>('[data-conversation-search]')?.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      conversationSearch = (event.target as HTMLInputElement).value
      renderConversations()
    })
    body.querySelectorAll<HTMLButtonElement>('[data-id]').forEach(button => { button.onclick = () => { void showMessages(button.dataset.id!) } })
  }

  const showConversations = async () => {
    if (!accountId) accountId = (await get<Array<{ id: number }>>('/wechat-conversations/accounts'))[0]?.id
    if (!accountId) throw new Error('暂无可访问微信账号。')
    const overview = await get<{ conversations: Conversation[] }>(`/wechat-conversations/accounts/${accountId}/conversations`)
    allConversations = overview.conversations
    renderConversations()
  }

  const groupName = (item: TouchItem): string => [item.actualCompanyName || item.sourceName || '未命名公司', item.wechatNickname, item.userName || item.username, '美加线Prime'].filter(Boolean).join('#')
  const bindCommand = (item: TouchItem): string => ['口令', item.userName || item.username || '-', item.batchDate || today(), item.contactValue || item.wechatId || '-'].join('#')

  const showTouchItems = async () => {
    const page = await get<{ content: TouchItem[] }>(`/wechat-touch/items?date=${today()}&page=1&size=100`)
    const body = view.querySelector<HTMLElement>('.pc-body')!
    body.innerHTML = `<section class="pc-touch-workbench"><div class="pc-toolbar pc-touch-toolbar"><div class="pc-touch-title"><strong>今日微信触达跟进</strong><span>${page.content.length} 条待处理</span></div></div>${page.content.length ? `<div class="pc-touch-table-wrap"><table class="pc-touch-table"><thead><tr><th>公司</th><th>联系方式</th><th>群名</th><th>口令</th><th>微信搜索</th><th>用户昵称</th><th></th></tr></thead><tbody>${page.content.map(item => { const contact = item.contactValue || item.wechatId || '-'; const command = bindCommand(item); return `<tr data-touch-id="${item.id}"><td class="pc-company">${html(item.actualCompanyName || item.sourceName || '未关联公司')}</td><td><span class="pc-copy-value">${html(contact)}</span>${copyButton(contact)}</td><td><span class="pc-copy-value">${html(groupName(item))}</span></td><td><span class="pc-copy-value">${html(command)}</span>${copyButton(command)}</td><td><select class="pc-select" data-field="wechatExists"><option value="" ${item.wechatExists == null ? 'selected' : ''}>未填写</option><option value="1" ${item.wechatExists === 1 ? 'selected' : ''}>已搜到</option><option value="0" ${item.wechatExists === 0 ? 'selected' : ''}>未搜到</option></select></td><td><input class="pc-input" data-field="wechatNickname" value="${html(item.wechatNickname)}" placeholder="填写微信昵称"></td><td><button class="pc-save" type="button">保存</button></td></tr>` }).join('')}</tbody></table></div>` : '<p class="pc-empty">今日暂无微信触达跟进。</p>'}</section>`
    body.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach(button => {
      button.onclick = async () => {
        await navigator.clipboard.writeText(button.dataset.copy ?? '')
        button.textContent = '已复制'
        window.setTimeout(() => { button.textContent = '复制' }, 1_200)
      }
    })
    body.querySelectorAll<HTMLElement>('[data-touch-id]').forEach(row => {
      const save = row.querySelector<HTMLButtonElement>('.pc-save')
      if (!save) return
      save.onclick = async () => {
        const id = row.dataset.touchId!
        const search = row.querySelector<HTMLSelectElement>('[data-field="wechatExists"]')!
        const nickname = row.querySelector<HTMLInputElement>('[data-field="wechatNickname"]')!
        save.disabled = true
        save.textContent = '保存中…'
        try {
          await put(`/wechat-touch/items/${id}`, { wechatExists: search.value === '' ? null : Number(search.value), wechatNickname: nickname.value.trim() || null })
          await showTouchItems()
        } catch (error) {
          save.disabled = false
          save.textContent = error instanceof Error ? error.message : '保存失败'
        }
      }
    })
  }

  const load = async () => {
    render()
    const body = view.querySelector<HTMLElement>('.pc-body')!
    body.innerHTML = '<p class="pc-empty">加载中…</p>'
    try {
      if (tab === 'chat') await showConversations()
      else if (tab === 'followup') await showTouchItems()
      else body.innerHTML = `<p class="pc-empty">${tab === 'dashboard' ? '早报、晚报将在 Prime Contact 日报持久化接口完成后接入。' : '客户维护规则将在聊天管理基础上接入。'}</p>`
    } catch (error) {
      body.textContent = error instanceof Error ? error.message : '加载失败'
    }
  }

  const place = () => {
    const sidebar = document.querySelector<HTMLElement>('[data-pane="sidebar"], [class*="sidebarCol"]')
    const center = document.querySelector<HTMLElement>('[data-pane="conversation"], [class*="centerCol"]')
    if (sidebar && !entry.isConnected) sidebar.querySelector('button[class*="newSession"]')?.insertAdjacentElement('afterend', entry)
    if (center && !view.isConnected) center.append(view)
  }
  new MutationObserver(place).observe(document.body, { childList: true, subtree: true })
  place()
  entry.onclick = () => {
    const open = !view.hasAttribute('data-open')
    view.toggleAttribute('data-open', open)
    entry.toggleAttribute('data-active', open)
    document.documentElement.toggleAttribute(ACTIVE, open)
    if (open) void load()
  }
}
