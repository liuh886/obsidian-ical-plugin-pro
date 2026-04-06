# iCal Pro for Obsidian

在 Markdown 中管理你的任务，并通过符合标准的 iCalendar 订阅同步到 Google 日历、Apple 日历和 Outlook。

![iCal Pro 示意图](assets/ical_pro_about.jpg)

> **Obsidian 日历同步的专业标准。**

> - **高保真 (High-Fidelity)**：严格遵循 RFC 5545 标准（折行、CRLF、转义）。
> - **零依赖 (Zero Dependency)**：原生支持 **Tasks** 和 **Day Planner** 语法，**无需**安装这些插件即可生效。
> - **隐私优先**：本地优先架构，可选 GitHub Gist 加密同步。
> - **深度语义**：智能的 `VEVENT`（事件）与 `VTODO`（待办）语义自动切分。

---

## 🔒 隐私与安全

iCal Pro 秉承“本地优先”的设计理念：
- **无数据收集**：我们不会追踪您的使用行为，也不会收集任何个人数据。
- **直接同步**：您的日历直接从您的设备同步到本地文件或 GitHub Gist，不经过任何第三方服务器。
- **安全存储**：您的 GitHub PAT 安全地存储在 Obsidian 的本地存储中，仅用于与 GitHub API 通信。

## 核心能力

- **智能同步**：自动将任务切分为 `VEVENT`（带时间）和 `VTODO`（仅日期/浮动）。
- **零依赖探索**：无需安装额外插件即可从 Daily Notes 文件名或标题继承日期。
- **可靠标识**：稳定的 `UID` 生成算法，确保任务在文件间移动时不会产生重复。
- **灵活目标**：支持同步到本地库文件或私有 GitHub Gist，实现全平台订阅。

## 支持的语法

iCal Pro 根据任务是否包含 **“时间”** 来智能切分类别。

| 特性 | 语法示例 | 映射结果 (iCalendar) |
| :--- | :--- | :--- |
| **日程 (Event)** | `- [ ] 2026-04-01 13:00-14:00 购物` | `VEVENT` (在日历网格显示) |
| **待办 (To-Do)** | `- [ ] 2026-04-01 购物` | `VTODO` (在侧边栏/提醒事项显示) |
| **待办 (浮动)** | `- [ ] 购物` | `VTODO` (未排程任务) |
| **优先级** | `⏫ 高` / `🔼 中` / `🔽 低` | `PRIORITY: 1 / 5 / 9` |
| **闹钟** | `⏰ 15` (提前 15 分钟) | `VALARM` |
| **循环** | `🔁 every weekday` | `RRULE` |
| **上下文** | `## 2026-04-01` (标题) | 自动继承日期 (Day Planner 模式) |

> [!IMPORTANT]
> **Google 日历兼容性**: Google 日历原生 **不支持** `VTODO`。如果您希望任务在 Google 日历的网格中显示，您 **必须** 在任务中包含具体的时间（如 `13:00`）。

## 核心能力


- **多路径规则**：将特定的库路径绑定到不同的日历分类。
- **精细过滤**：通过全局过滤器、标签或分类进行包含/排除。
- **任务高保真**：原生支持 **优先级** (`⏫🔼🔽`)、**循环** (`🔁`) 和 **闹钟** (`⏰`)。
- **富文本正文**：完整抓取任务下方的列表或引用块内容，并映射到 `DESCRIPTION`。
- **自诊断系统**：内置同步预览、分目标报告以及脱敏的诊断包。

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

1. 通过 **BRAT** 安装 `liuh886/obsidian-ical-plugin-pro`。
2. 在设置中添加 **Source Path Rule**（例如您的任务或日记文件夹）。
3. 启用一个 **输出目标**（本地文件或 GitHub Gist）。
4. 若使用 Gist，填入您的 PAT 和 Gist ID，然后点击 **Validate**。
5. 点击 **Sync Now**，并在日历应用中订阅生成的链接。

## 常见问题 (FAQ)

**问：为什么我的待办事项 (VTODO) 没有在 Google 日历中显示？**
答：Google 日历原生仅支持 `VEVENT`（日历事件）。若需完整的 `VTODO` 支持，建议使用 Apple Calendar、Microsoft Outlook，或支持 iCal 订阅的专业任务管理应用（如“提醒事项”）。

**问：使用 GitHub Gist 安全吗？**
答：安全。Gist 属于您的个人资产。我们建议使用“私有 (Private) Gist”以确保最高隐私。您的个人访问令牌 (PAT) 除用于与 GitHub 通信外，绝不会离开您的设备。

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
