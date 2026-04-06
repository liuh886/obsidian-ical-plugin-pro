# iCal Pro for Obsidian

在 Markdown 中管理你的任务，并通过符合标准的 iCalendar 订阅同步到 Google 日历、Apple 日历和 Outlook。

![iCal Pro 示意图](assets/ical_pro_about.jpg)

> **Obsidian 日历同步的专业标准。**

> - **高保真 (High-Fidelity)**：严格遵循 RFC 5545 标准（折行、CRLF、转义）。
> - **零依赖 (Zero Dependency)**：原生支持 **Tasks** 和 **Day Planner** 语法，**无需**安装这些插件即可生效。
> - **隐私优先**：本地优先架构，可选 GitHub Gist 加密同步。
> - **深度语义**：智能的 `VEVENT`（事件）与 `VTODO`（待办）语义自动切分。

## 核心能力

- 带时间的任务导出为 `VEVENT`（在日历网格中展示）
- 有日期但没有时间的任务导出为 `VTODO`（在提醒事项/侧边栏展示）
- 没有日期的任务导出为浮动 `VTODO`
- 支持 Day Planner 风格的日期继承（标题、文件名）
- 支持本地 `.ics` 文件导出和 GitHub Gist 同步
- 保留 Obsidian 笔记回跳链接 (`obsidian://`)

## 支持的语法

iCal Pro 为兼容性而生，开箱即用支持主流任务格式：

| 特性 | 语法示例 | iCal 映射 |
| :--- | :--- | :--- |
| **日期** | `📅 2024-03-20` / `⏳ 2024-03-21` | `DUE` / `DTSTART` |
| **优先级** | `⏫ 高` / `🔼 中` / `🔽 低` | `PRIORITY: 1 / 5 / 9` |
| **闹钟** | `⏰ 15` (提前 15 分钟) | `VALARM` |
| **循环** | `🔁 every weekday` | `RRULE` |
| **时间范围**| `09:00 - 10:30` | `DTSTART` & `DTEND` |
| **上下文** | `## 2024-03-20` (标题) | 自动继承日期 |

## 已实现功能

- 多路径导出规则：一个路径绑定一个分类，可配置多条
- 过滤能力：
  - Tasks 全局过滤兼容
  - 标签 include / exclude
  - 分类 include / exclude
- 任务语义增强：
  - 优先级表情映射到 RFC 5545 `PRIORITY`
  - 常见 `every ...` 循环规则映射到 `RRULE`
  - `待办 / 进行中 / 已取消 / 已完成` 生命周期映射
  - 可选 `VALARM` 提醒
- 解析增强：
  - 任务下方列表、缩进内容、引用块正文抓取
  - 支持 `> - [ ] 09:00 ...` 这类 callout / blockquote 任务
  - 清洗 Obsidian / Dataview 语法，避免脏内容进入 ICS
- 可运维能力：
  - 启动自动同步
  - 定时同步
  - 同步预览：导出数、过滤数、`VEVENT` 数、`VTODO` 数
  - 分目标同步结果报告
  - 可复制的诊断包
  - 解释为什么任务被过滤、为什么降级为 `VTODO`

## 日历语义

默认在 `EventsAndTodos` 模式下：

- 有日期且有时间 -> `VEVENT`
- 有日期但无时间 -> `VTODO`
- 无日期 -> floating `VTODO`

## 兼容性

导出的 `.ics` 面向 RFC 5545 兼容客户端，包括：

- Google Calendar
- Apple Calendar
- Outlook
- Proton Calendar
- Thunderbird
- 其他支持 iCalendar 订阅的客户端

需要注意：不同客户端对 `VTODO` 的支持能力不同，Apple 生态通常比 Google Calendar 更完整。

## 快速开始

1. 通过 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 安装，仓库地址填 `liuh886/obsidian-ical-plugin-pro`
2. 打开 `iCal Pro` 设置页
3. 至少添加一条 source path rule
4. 至少启用一个输出目标：
   - 本地 `.ics` 文件
   - GitHub Gist
5. 如果启用 Gist，填写 GitHub 用户名、Gist ID、PAT，然后点击 `Validate`
6. 点击 `Sync Now`
7. 在日历客户端订阅生成的 Gist raw URL 或本地 `.ics` 文件

## 设置页结构

- `Scope & Discovery`：路径到分类的绑定规则
- `Scheduling & Alarms`：Day Planner、同步策略、多日期处理、提醒
- `Content & Filters`：标签/分类过滤、完成项过滤
- `Sync & Cloud Connectivity`：文件名、本地路径、Gist 同步、连接校验
- `Advanced & Diagnostics`：链接格式、自动同步、调试、诊断

设置页顶部状态卡现在会展示：

- 当前 readiness 状态
- 同步预览
- 最近一次分目标同步结果
- 诊断包复制按钮

## 开发命令

- `npm run build`
- `npm run typecheck`
- `npm run test:smoke`
- `npm run validate`

## 协议

MIT

---

## 支持与打赏

如果你觉得这个插件对你有帮助，欢迎请我喝杯咖啡，支持我的持续开发！

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/F1F7WYJ6B)
