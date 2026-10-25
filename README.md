# Lee悦时间安排（手机 PWA）

基于 TianyiDataScience/my-own-app（桌面版 React+Fastify+SQLite）做的**手机离线 PWA 原型**。单文件 `index.html`（无依赖、无在线字体/图片/图标、无账号、无云）。

文件：`index.html`（全部 UI+逻辑） · `manifest.webmanifest` · `sw.js`（离线缓存） · `icons/`（取自仓库 public/assets/brand）

## 在手机上使用
1. **局域网**：电脑在本目录运行 `python3 -m http.server 8000`，手机（同一 Wi‑Fi）Safari/Chrome 打开 `http://电脑IP:8000/`。注意：Service Worker（离线）只在 HTTPS 或 localhost 下生效；局域网 http 可用但不离线。
2. **推荐：HTTPS 托管**（GitHub Pages / Cloudflare Pages / Netlify 拖拽上传本目录）→ 手机 Safari 打开 → 分享 →「添加到主屏幕」。之后完全离线可用。
3. 直接把 HTML 发到手机：可以看，但**聊天 App 内置预览里的 localStorage 不持久**，iOS 一定要用 **Safari 打开**再添加到主屏幕。
4. iOS 提醒：Safari 对未添加到主屏幕的网站可能在 7 天不访问后清除存储；请添加到主屏幕并定期「导出 JSON」。

## 数据存储
- 选 **localStorage**（单键 `muzi-mobile-data-v1`，整份 JSON）：同步读写、无需异步迁移、各浏览器行为最一致、易调试；个人数据量（几千条）远低于 ~5MB 上限。启动时调用 `navigator.storage.persist()` 申请持久化，设置页显示状态。数据超过约 3MB 时应迁移到 IndexedDB（下一步）。
- 删除为软删除（`deleted_at`）+ 回收站，与桌面版一致。

## 电脑 ↔ 手机同步（手动导入/导出）
- 手机 → 电脑：设置 →「导出 JSON」→ 通过 AirDrop/微信文件传输到电脑。
- 电脑 → 手机：桌面版「导出」得到 `muzi-export-*.zip`，解压取出 **all-data.json** → 发到手机 → 设置 →「导入 JSON」。
- 导入为**整体覆盖**，覆盖前自动下载一份手机当前数据备份。

### 与桌面版格式对齐
- 导出 JSON 结构 = 桌面版 `store.state()`（即 zip 里的 all-data.json）：顶层 25 个集合键（`planItems, quickMemos, workouts, workoutExercises, workoutSets, meals, mealItems, entertainmentItems, playSessions, mediaContents, devProjects, clients, consultingProjects …`）+ `settings`（`theme: light|dark`、`appearance: liquid|notebook|neo`）+ `trash`；字段名为 SQLite 列名（snake_case），主键 UUID，含 `created_at/updated_at/deleted_at`。
- 桌面 → 手机：可直接导入，全部集合原样保存；手机未实现的集合（开发里程碑、咨询沟通/交付等）也会保留并随下次导出带回。
- 手机 → 桌面：**桌面版目前只能从 .sqlite 备份恢复，没有“导入 JSON”接口**。需要在桌面版加一个 `POST /api/import`（按 collectionDefinitions 逐表 upsert，按 updated_at 取新）——这是对齐的关键下一步。
- 差异：手机多一个 `_meta` 字段（桌面忽略即可）；手机 `trash` 条目字段为 `{id, collection, entity_id, title, deleted_at}`，可能与桌面 `trash_entries` 列名不同，需映射；部分枚举值（媒体阶段、开发状态、娱乐类型/状态 `wishlist/active/paused/completed`、餐次 `breakfast/lunch/dinner/snack`）是按迁移 SQL 默认值推测，需与桌面前端常量核对；`daily_reviews` 未导出。

## 已实现
- 首页总览：今日计划进度条、待完成/今日训练/今日热量、快速备忘（新增、归档、一键转今日计划）、今日待办、进行中娱乐
- 今日计划：按日期切换、增删改、完成/撤销、优先级（高/中/低排序）、延期一天、逾期一键移到今天
- 健身：训练（名称/部位/日期）→ 动作 → 组（次数、重量，可勾选完成），总容量，完成训练；身体指标
- 饮食：按日期 4 个餐次添加食物/份量/热量/蛋白质，每日目标与进度
- 游戏娱乐：清单（想玩/进行中/暂停/已完成）、进度、下一目标、评分；计时（刷新/切页不丢），停止后写入 playSessions 并累计时长
- 自媒体 / 开发 / 咨询：简化列表（增改删）
- 设置：导出/导入 JSON、清空（二次确认）、回收站恢复/永久清空、深浅色、三种外观（流光玻璃 / Notion 笔记 / Neo-Brutalism）
- PWA：manifest、Service Worker 离线、安全区（刘海/Home 条）、底部 Tab、≥44px 触控区、输入框 16px 防 iOS 缩放

## 下一步
1. 桌面版增加 JSON 导入（合并 upsert），实现双向同步；可选局域网同步（手机直连桌面 Fastify `/api`）
2. 健身模板、饮食常用食物库、自媒体五阶段看板、开发工作项/日志、咨询跟进与工时
3. 数据增大后迁移 IndexedDB；全局搜索；每日复盘
4. 计划项关联业务来源（source_entity_*）

## 任务结束提醒（v0.2）
**怎么用**：计划页 → + 新增/点任务编辑 → 填「开始时间」+「结束时间」（或「预计分钟」）→「结束时提醒」开 →「提前提醒」准点/5/10 分钟。任务行显示 🔔 和倒计时/已逾期；首页显示「下一个要结束的任务」。
到点后弹出全屏提醒卡片并循环响铃（Android 还会振动），直到点：**完成 / 知道了 / 延后 5 分钟 / 延后 15 分钟**。App 在后台或锁屏时错过的提醒，回到 App 时会补弹（24 小时内）。
设置 →「任务结束提醒」：提醒音开关、音量与试听、系统通知授权状态与「开启通知」、「测试提醒（10 秒后）」。

**iOS 限制（诚实说明）**
- 这是纯本地 PWA，**没有服务器推送**。App 打开或刚切回前台时提醒一定会出现；App 在后台被 iOS 挂起/杀掉后，**无法保证准点**提醒，只会在下次打开时补弹。
- 系统通知需要 iOS 16.4+，且必须先「添加到主屏幕」并从主屏幕图标打开，再点「开启通知」授权。授权后，App 仍在后台存活时会尽力发系统通知。
- 定时通知（Notification Triggers）目前主流浏览器都不支持；代码只做特性检测，支持时才使用，不支持时不假装可用。
- iOS 不支持网页振动；首次响铃前需要在页面上点一下（浏览器自动播放策略）。重要事项请同时用系统闹钟/日历兜底。

**数据字段**：时间沿用桌面版 `plan_items` 的 `start_time` + `estimated_minutes`（结束时间 = 开始 + 时长，不另存）。新增的手机专用字段放在 `planItems` 记录里：`remind_at_end`(0/1)、`remind_before_minutes`(0/5/10)、`reminder_snooze_until`、`reminder_ack_at`。桌面版导入时会忽略这些字段（导入结果里列为忽略字段），不影响其他数据；导出 `_meta.mobileOnlyFields` 中有说明。

**更新已添加到主屏幕的旧版本**：联网时从主屏幕打开一次 App，彻底关闭（上滑划掉）后再打开即为新版（Service Worker 缓存已升级为 v2，页面改为联网优先）。若仍是旧版：Safari 打开网址刷新一次后再从主屏幕打开。数据保存在本机，更新不会丢失（仍建议先导出备份）。

## 改名说明（v0.3）
App 已更名为「Lee悦时间安排」。导出文件名改为 `lee-time-export-日期.json`；旧版导出的 `muzi-mobile-*.json` 仍可直接导入。本机存储 key 未改，升级不会丢数据。已添加到主屏幕的旧图标名字不会自动改变，请删除后重新「添加到主屏幕」（删除前先导出备份更稳妥）。

## 部署说明
图标以 base64 文本（`icons/*.png.b64`）提交，GitHub Actions（`.github/workflows/pages.yml`）构建时解码为 PNG 并发布到 GitHub Pages。
