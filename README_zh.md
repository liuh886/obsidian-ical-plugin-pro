# iCal Pro for Obsidian

**Agent 安排的工作如何既沉淀在 Obsidian Day Planner 中，又能被 Google Calendar 同步？iCal Pro！**

iCal Pro 是一款专为高效工作流设计的同步工具。它能够将你在 Obsidian 笔记中标记的任务（无论是手动记录还是 AI Agent 生成）自动转化为标准日历格式，并同步至 Google Calendar、Apple Calendar 或 Outlook。

## 核心功能
- **任务即日程**：识别带日期的任务行（支持标准日期及 `📅`, `🛫`, `⏳` 等图标），自动生成日历事件。
- **全自动描述抓取**：自动提取任务下方的引用块（`>`）、列表或缩进文字，作为日历事件的详细描述（Description）。
- **极速增量索引**：仅在文件修改时更新缓存，彻底解决大型知识库（万篇笔记以上）扫描卡顿的问题。
- **精准时区锁定**：采用“浮动时间”策略并注入时区头，确保在全球任何地方查看日历时，时间都不会发生偏移。
- **一键回跳笔记**：日历事件附带 `obsidian://` 链接，点击即可直接打开对应的 Obsidian 笔记位置。

## 解决的需求
1. **AI 自动化闭环**：AI Agent 在 Daily Note 里排好的计划，无需手动录入，自动出现在手机日历提醒中。
2. **多平台同步**：让你的 Obsidian 任务在所有移动设备上可见。
3. **复杂任务展示**：在日历中直接查看任务背后的上下文（如航班信息、会议大纲），而不仅仅是一个标题。

## 安装指南 (BRAT)
在插件正式上架 Obsidian 市场前，推荐通过 **BRAT** 插件安装：
1. 安装并启用 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件。
2. 在 BRAT 设置中点击 **"Add Beta plugin"**。
3. 输入本项目地址：`liuh886/obsidian-ical-plugin-pro`
4. 点击 **"Add Plugin"**，之后在第三方插件列表中启用 **iCal Pro**。

## 快速配置
1. **获取 Token**：在 GitHub [申请一个 Token](https://github.com/settings/tokens?type=beta)（需勾选 `Gist` 权限）。
2. **准备 Gist**：在 [gist.github.com](https://gist.github.com/) 创建一个空的 Gist，并记下 URL 末尾的 ID。
3. **填入设置**：在 iCal Pro 设置页面填入用户名、Gist ID 和 Token。
4. **订阅**：点击设置顶部的 **"Sync Now"** 按钮，复制生成的 URL 到日历 App 中订阅。

## 开源协议
MIT | 本项目基于 Andrew Brereton 的 [obsidian-ical-plugin](https://github.com/andrewbrereton/obsidian-ical-plugin) 进行重构增强。
