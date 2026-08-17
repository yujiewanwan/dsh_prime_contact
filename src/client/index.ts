const API = '/plugins/prime-contact/api'
const ACTIVE = 'data-prime-contact-active'
export const inject = ['slots', 'connection']
type ReactRuntime = {
  createElement: (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => unknown
  useState: <T>(initial: T) => [T, (value: T) => void]
}
declare const require: (name: string) => ReactRuntime
async function get<T>(path: string): Promise<T> { const response = await fetch(`${API}${path}`); if (!response.ok) throw new Error(response.status === 503 ? '请配置 PRIME_CONTACT_TOKEN。' : 'Prime Contact 请求失败。'); const body = await response.json() as { data?: T }; return (body.data ?? body) as T }
function css(): void { if (document.querySelector('style[data-prime-contact-css]')) return; const tag = document.createElement('style'); tag.dataset.primeContactCss = ''; tag.textContent = `html[${ACTIVE}] [data-pane="conversation"]>*:not([data-prime-contact-view]),html[${ACTIVE}] [class*="centerCol"]>*:not([data-prime-contact-view]){display:none!important}.pc-entry{margin:4px 10px;width:calc(100% - 20px);padding:8px 10px;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer}.pc-entry:hover,.pc-entry[data-active],.pc-tabs button[data-active],.pc-row:hover{background:var(--dsw-alias-interactive-bg-hover)}.pc-view{display:none;height:100%;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);overflow:hidden}.pc-view[data-open]{display:flex;flex-direction:column}.pc-head{height:56px;display:flex;align-items:center;padding:0 20px;border-bottom:1px solid var(--dsw-alias-border-l2);gap:16px}.pc-head strong{margin-right:auto}.pc-tabs{display:flex;gap:4px}.pc-tabs button{border:0;border-radius:6px;padding:6px 9px;background:transparent;color:inherit;font:inherit;cursor:pointer}.pc-body{min-height:0;flex:1;overflow:auto}.pc-split{display:grid;grid-template-columns:32% 1fr;height:100%}.pc-list{overflow:auto;border-right:1px solid var(--dsw-alias-border-l2)}.pc-row{display:block;width:100%;padding:11px 14px;border:0;border-bottom:1px solid var(--dsw-alias-border-l1);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.pc-row small,.pc-note{display:block;margin-top:4px;color:var(--dsw-alias-label-tertiary)}.pc-detail{padding:16px;overflow:auto}.pc-message{max-width:75%;margin:10px 0;padding:9px 11px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-size:13px}.pc-message.out{margin-left:auto;background:var(--dsw-alias-interactive-bg-hover-solid)}.pc-empty{padding:24px;color:var(--dsw-alias-label-tertiary)}.pc-todo{padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}`; document.head.append(tag) }
function installSettings(ctx: any): void {
  const React = require('react')
  const connection = ctx.get('connection') as { api: { credentials: { set: (payload: { ref: string; value: string }) => Promise<unknown> } } }
  const inputStyle = { display: 'block', boxSizing: 'border-box', width: '100%', marginTop: '6px', padding: '8px 10px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: '6px', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', font: 'inherit' }
  const labelStyle = { display: 'block', marginTop: '14px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' }
  const SettingsCard = () => {
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
      React.createElement('form', { onSubmit: save, style: { maxWidth: '560px', padding: '20px 24px' } },
        React.createElement('h3', { style: { margin: '0 0 4px' } }, 'Prime Contact'),
        React.createElement('p', { style: { margin: '0 0 4px', color: 'var(--dsw-alias-label-secondary)' } }, '用于微信沟通、今日触达跟进等 Prime Contact 数据。'),
        React.createElement('label', { style: labelStyle }, '服务地址', React.createElement('input', { style: inputStyle, value: baseUrl, onChange: (event: any) => setBaseUrl(event.target.value), placeholder: 'http://127.0.0.1:9001' })),
        React.createElement('label', { style: labelStyle }, '用户名', React.createElement('input', { style: inputStyle, value: username, onChange: (event: any) => setUsername(event.target.value), autoComplete: 'username' })),
        React.createElement('label', { style: labelStyle }, '密码', React.createElement('input', { style: inputStyle, type: 'password', value: password, onChange: (event: any) => setPassword(event.target.value), autoComplete: 'current-password' })),
        React.createElement('button', { type: 'submit', style: { marginTop: '18px', padding: '8px 14px', border: 0, borderRadius: '6px', background: 'var(--dsw-alias-interactive-bg-hover-solid)', color: 'var(--dsw-alias-label-primary)', font: 'inherit', cursor: 'pointer' } }, '保存配置'),
        status ? React.createElement('p', { style: { marginTop: '12px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' } }, status) : null,
      ),
    )
  }
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register(
    { name: 'settings.plugin.item', id: 'prime-contact', order: 30 },
    SettingsCard,
  ))
}
export function apply(ctx: any): void { if (document.querySelector('[data-prime-contact-entry]')) return; css(); installSettings(ctx); const entry = document.createElement('button'); entry.className = 'pc-entry'; entry.dataset.primeContactEntry = ''; entry.textContent = '微信沟通'; const view = document.createElement('section'); view.className = 'pc-view'; view.dataset.primeContactView = ''; let tab = 'dashboard'; let accountId: number | undefined
  const render = () => { view.innerHTML = `<header class="pc-head"><strong>微信沟通</strong><nav class="pc-tabs">${[['dashboard','看板'],['followup','今日触达跟进'],['maintenance','今日客户维护'],['chat','聊天管理']].map(([id,name]) => `<button data-tab="${id}" ${tab === id ? 'data-active' : ''}>${name}</button>`).join('')}</nav></header><main class="pc-body"></main>`; view.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button => button.onclick = () => { tab = button.dataset.tab!; void load() }) }
  const load = async () => { render(); const body = view.querySelector<HTMLElement>('.pc-body')!; body.innerHTML = '<p class="pc-empty">加载中…</p>'; try { if (tab === 'chat') { if (!accountId) accountId = (await get<Array<{ id: number }>>('/wechat-conversations/accounts'))[0]?.id; if (!accountId) throw new Error('暂无可访问微信账号。'); const overview = await get<{ conversations: Array<{ id: number; type: string; displayName: string; lastMessageSummary?: string }> }>(`/wechat-conversations/accounts/${accountId}/conversations`); body.innerHTML = `<div class="pc-split"><div class="pc-list">${overview.conversations.map(item => `<button class="pc-row" data-id="${item.id}"><b>${item.type === 'GROUP' ? '群' : '单'} · ${item.displayName}</b><small>${item.lastMessageSummary ?? ''}</small></button>`).join('')}</div><div class="pc-detail">选择一个会话查看聊天记录。</div></div>`; body.querySelectorAll<HTMLButtonElement>('[data-id]').forEach(button => button.onclick = async () => { const detail = body.querySelector<HTMLElement>('.pc-detail')!; const rows = await get<Array<{ senderName?: string; direction: string; content?: string; messageType: string }>>(`/wechat-conversations/accounts/${accountId}/conversations/${button.dataset.id}/messages`); detail.innerHTML = rows.map(row => `<div class="pc-message ${row.direction === 'OUT' ? 'out' : ''}"><small>${row.senderName ?? ''}</small><br>${row.content ?? `[${row.messageType}]`}</div>`).join('') }) } else if (tab === 'followup') { const page = await get<{ content: Array<{ companyName?: string; contactName?: string; contactValue?: string; intentLevel?: string; overdueDays: number }> }>('/wechat-touch/daily-todo?page=1&size=50'); body.innerHTML = page.content.map(item => `<article class="pc-todo"><b>${item.companyName ?? '未关联公司'} · ${item.contactName ?? '未知联系人'}</b><br>${item.contactValue ?? ''} · ${item.intentLevel ?? ''} · 逾期 ${item.overdueDays} 天</article>`).join('') || '<p class="pc-empty">今日暂无触达跟进。</p>' } else body.innerHTML = `<p class="pc-empty">${tab === 'dashboard' ? '早报、晚报将在 Prime Contact 日报持久化接口完成后接入。' : '客户维护规则将在聊天管理基础上接入。'}</p>` } catch (error) { body.innerHTML = `<p class="pc-empty">${error instanceof Error ? error.message : '加载失败'}</p>` } }
  const place = () => { const sidebar = document.querySelector<HTMLElement>('[data-pane="sidebar"], [class*="sidebarCol"]'); const center = document.querySelector<HTMLElement>('[data-pane="conversation"], [class*="centerCol"]'); if (sidebar && !entry.isConnected) sidebar.querySelector('button[class*="newSession"]')?.insertAdjacentElement('afterend', entry); if (center && !view.isConnected) center.append(view) }; new MutationObserver(place).observe(document.body, { childList: true, subtree: true }); place(); entry.onclick = () => { const open = !view.hasAttribute('data-open'); view.toggleAttribute('data-open', open); entry.toggleAttribute('data-active', open); document.documentElement.toggleAttribute(ACTIVE, open); if (open) void load() }
}
