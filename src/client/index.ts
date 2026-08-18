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
function today(): string { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date()) }
function css(): void { if (document.querySelector('style[data-prime-contact-css]')) return; const tag = document.createElement('style'); tag.dataset.primeContactCss = ''; tag.textContent = `html[${ACTIVE}] [data-pane="conversation"]>*:not([data-prime-contact-view]),html[${ACTIVE}] [class*="centerCol"]>*:not([data-prime-contact-view]){display:none!important}.pc-entry{margin:4px 10px;width:calc(100% - 20px);padding:8px 10px;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer}.pc-entry:hover,.pc-entry[data-active],.pc-tabs button[data-active],.pc-row:hover,.pc-subtabs button[data-active]{background:var(--dsw-alias-interactive-bg-hover)}.pc-view{display:none;height:100%;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);overflow:hidden}.pc-view[data-open]{display:flex;flex-direction:column}.pc-head{height:56px;display:flex;align-items:center;padding:0 20px;border-bottom:1px solid var(--dsw-alias-border-l2);gap:16px}.pc-head strong{margin-right:auto}.pc-tabs,.pc-subtabs{display:flex;gap:4px}.pc-tabs button,.pc-subtabs button{border:0;border-radius:6px;padding:6px 9px;background:transparent;color:inherit;font:inherit;cursor:pointer}.pc-body{min-height:0;flex:1;overflow:auto}.pc-split{display:grid;grid-template-columns:32% 1fr;height:100%}.pc-list{overflow:auto;border-right:1px solid var(--dsw-alias-border-l2)}.pc-row{display:block;width:100%;padding:11px 14px;border:0;border-bottom:1px solid var(--dsw-alias-border-l1);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.pc-row small,.pc-note{display:block;margin-top:4px;color:var(--dsw-alias-label-tertiary)}.pc-detail{padding:16px;overflow:auto}.pc-message{max-width:75%;margin:10px 0;padding:9px 11px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-size:13px}.pc-message.out{margin-left:auto;background:var(--dsw-alias-interactive-bg-hover-solid)}.pc-empty{padding:24px;color:var(--dsw-alias-label-tertiary)}.pc-toolbar{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}.pc-touch{padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}.pc-touch-grid{display:grid;grid-template-columns:minmax(120px,1fr) minmax(160px,1.5fr) minmax(160px,1.5fr);gap:12px;margin-top:10px}.pc-field label{display:block;margin-bottom:5px;color:var(--dsw-alias-label-tertiary);font-size:12px}.pc-field input,.pc-field select{box-sizing:border-box;width:100%;padding:7px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit}.pc-save{align-self:end;padding:7px 10px;border:0;border-radius:6px;background:var(--dsw-alias-interactive-bg-hover-solid);color:inherit;font:inherit;cursor:pointer}`; document.head.append(tag) }
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

type Conversation = { id: number; type: string; displayName: string; lastMessageSummary?: string }
type TouchItem = { id: number; batchDate?: string; actualCompanyName?: string; sourceName?: string; contactValue?: string; wechatId?: string; wechatNickname?: string; wechatExists?: number; userName?: string; username?: string }

export function apply(ctx: any): void {
  if (document.querySelector('[data-prime-contact-entry]')) return
  css()
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

  const render = () => {
    view.innerHTML = `<header class="pc-head"><strong>微信沟通</strong><nav class="pc-tabs">${[['dashboard', '看板'], ['followup', '今日触达跟进'], ['maintenance', '今日客户维护'], ['chat', '聊天管理']].map(([id, name]) => `<button data-tab="${id}" ${tab === id ? 'data-active' : ''}>${name}</button>`).join('')}</nav></header><main class="pc-body"></main>`
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

  const showConversations = async () => {
    if (!accountId) accountId = (await get<Array<{ id: number }>>('/wechat-conversations/accounts'))[0]?.id
    if (!accountId) throw new Error('暂无可访问微信账号。')
    const overview = await get<{ conversations: Conversation[] }>(`/wechat-conversations/accounts/${accountId}/conversations`)
    const conversations = overview.conversations.filter(item => conversationType === 'GROUP' ? item.type === 'GROUP' : item.type !== 'GROUP')
    const body = view.querySelector<HTMLElement>('.pc-body')!
    body.innerHTML = `<div class="pc-toolbar"><nav class="pc-subtabs"><button data-conversation-type="DIRECT" ${conversationType === 'DIRECT' ? 'data-active' : ''}>单聊</button><button data-conversation-type="GROUP" ${conversationType === 'GROUP' ? 'data-active' : ''}>群聊</button></nav><span class="pc-note">${conversations.length} 个会话</span></div><div class="pc-split"><div class="pc-list">${conversations.map(item => `<button class="pc-row" data-id="${item.id}"><b>${html(item.displayName)}</b><small>${html(item.lastMessageSummary)}</small></button>`).join('') || '<p class="pc-empty">暂无会话。</p>'}</div><div class="pc-detail">选择一个会话查看聊天记录。</div></div>`
    body.querySelectorAll<HTMLButtonElement>('[data-conversation-type]').forEach(button => { button.onclick = () => { conversationType = button.dataset.conversationType!; void showConversations() } })
    body.querySelectorAll<HTMLButtonElement>('[data-id]').forEach(button => { button.onclick = () => { void showMessages(button.dataset.id!) } })
  }

  const groupName = (item: TouchItem): string => [item.actualCompanyName || item.sourceName || '未命名公司', item.wechatNickname, item.userName || item.username, '美加线Prime'].filter(Boolean).join('#')
  const bindCommand = (item: TouchItem): string => ['口令', item.userName || item.username || '-', item.batchDate || today(), item.contactValue || item.wechatId || '-'].join('#')

  const showTouchItems = async () => {
    const page = await get<{ content: TouchItem[] }>(`/wechat-touch/items?date=${today()}&page=1&size=100`)
    const body = view.querySelector<HTMLElement>('.pc-body')!
    body.innerHTML = `<div class="pc-toolbar"><strong>今日微信触达跟进</strong><span class="pc-note">${page.content.length} 条</span></div>${page.content.map(item => `<article class="pc-touch" data-touch-id="${item.id}"><b>${html(item.actualCompanyName || item.sourceName || '未关联公司')}</b><div class="pc-touch-grid"><div class="pc-field"><label>联系方式</label><span>${html(item.contactValue || item.wechatId || '-')}</span></div><div class="pc-field"><label>群名</label><span>${html(groupName(item))}</span></div><div class="pc-field"><label>口令</label><span>${html(bindCommand(item))}</span></div><div class="pc-field"><label>微信搜索</label><select data-field="wechatExists"><option value="" ${item.wechatExists == null ? 'selected' : ''}>未填写</option><option value="1" ${item.wechatExists === 1 ? 'selected' : ''}>已搜到</option><option value="0" ${item.wechatExists === 0 ? 'selected' : ''}>未搜到</option></select></div><div class="pc-field"><label>用户昵称</label><input data-field="wechatNickname" value="${html(item.wechatNickname)}" placeholder="填写微信昵称"></div><button class="pc-save" type="button">保存</button></div></article>`).join('') || '<p class="pc-empty">今日暂无微信触达跟进。</p>'}`
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
