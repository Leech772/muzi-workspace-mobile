# 木子工作台 Mobile（手机原型 v0.1）

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

## 部署说明
图标以 base64 文本（`icons/*.png.b64`）提交，GitHub Actions（`.github/workflows/pages.yml`）构建时解码为 PNG 并发布到 GitHub Pages。
