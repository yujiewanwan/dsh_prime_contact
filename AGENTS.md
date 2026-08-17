# dsh_prime_contact

## 项目定位

`dsh_prime_contact` 是 DeepSeek Harness 的插件项目，作为 DeepSeek Harness 与 Prime Contact 之间的集成层。

插件为 DeepSeek Harness 提供菜单入口和数据访问能力，使用户能够在 DeepSeek Harness 中查看 Prime Contact 的业务信息。

## 关联项目

- Prime Contact：`/Users/yujie/IdeaProjects/yujiewanwan/prime_contact`
- DeepSeek Harness：`/Users/yujie/IdeaProjects/yujiewanwan/deepseek-harness`

实现前应分别确认 DeepSeek Harness 的插件扩展点、菜单注册方式和前端集成约定，以及 Prime Contact 可用的数据接口、数据模型和认证机制。

## 功能边界

- 在 DeepSeek Harness 中注册 Prime Contact 相关菜单。
- 提供菜单页面所需的 Prime Contact 信息展示能力。
- 通过受控的服务接口读取 Prime Contact 数据。
- 保持插件与 Prime Contact 业务实现解耦；插件只承担集成、展示和必要的数据适配职责。

## DeepSeek Harness 插件形态

本项目采用 DSH Web 的 profile bundle 形态，不修改 DeepSeek Harness 源码。

- 包清单声明 `dsh.bundle.patch`，指向 `cordis.patch.yml`，使 `dsh plugin --profile web add <package>` 将插件加入 Web profile。
- `cordis.patch.yml` 插入一个具名 Cordis 插件行；该行的 `id` 必须稳定且唯一。
- 包清单声明 `dsh.client`，设置 `platform: "web"`，并导出 `./client`；DSH Web 据此加载浏览器端构建产物。
- 宿主端入口导出 `apply(ctx, config)`，运行在 Node.js 进程；浏览器端入口导出 `apply(ctx)`，运行在 DSH Web 页面。
- 浏览器端通过 DSH 的 slot 注册侧边栏入口与内容页面；所有注册必须可释放，避免热重载或重复加载时出现重复菜单。
- 浏览器端构建产物必须随包发布；DSH 只加载 `exports["./client"]` 指向的已构建文件。

建议目录结构：

```text
src/index.ts           # 宿主端：Prime Contact 数据代理与配置
src/client/index.ts    # 浏览器端：菜单、页面与交互
src/shared/            # 不含凭据的 DTO、查询参数和展示模型
cordis.patch.yml       # profile 插件行
package.json           # dsh.bundle 与 dsh.client 声明
```

## 认证与安全

- Prime Contact 的认证信息属于敏感信息，禁止硬编码到源代码、前端代码、提交记录、日志或文档中。
- 认证凭据仅从安全的运行时配置或密钥管理机制读取。
- 前端不得直接持有 Prime Contact 的长期凭据；由受控的服务端或插件后端代理请求。
- 日志、错误信息和调试输出不得包含令牌、Cookie、Authorization 请求头、密码或完整认证响应。
- 接口调用遵循最小权限原则，并在接入时明确认证失效、权限不足和数据访问失败的用户可见处理。
- Prime Contact 请求只能由宿主端发起；浏览器端仅调用同源的插件数据接口，或 DSH 的受控宿主 RPC。
- 认证配置只保存 Prime Contact 的地址和凭据引用；令牌值通过宿主进程运行时环境或凭据提供方解析。
- 插件数据接口只返回页面展示所需字段，禁止将 Prime Contact 原始认证响应或会话信息透传给浏览器。
- 当 DSH Web 对局域网开放时，插件数据接口必须继承其访问控制；未配置访问控制时仅允许回环地址访问。

## 开发约定

- 修改跨项目集成行为时，同时核对两个关联项目的接口契约与版本兼容性。
- 对外展示的数据应明确加载、空数据、无权限和异常状态。
- 提交信息遵循 Conventional Commits。
