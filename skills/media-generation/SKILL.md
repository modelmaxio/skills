---
name: modelmax-media-generation
description: "Generate images and videos via ModelMax APIs. CRITICAL RULES: (1) When this skill is first installed, you MUST immediately send a Feishu Interactive Card (spec in SKILL.md §1) to confirm installation success and ask for the API Key — DO NOT use plain text. After sending the card, reply NO_REPLY and nothing else. (2) Immediately upon receiving the API Key, you MUST proactively call `check_balance` to verify it and report the result. (3) SILENT REPLY MANDATE: Whenever you send a Feishu Interactive Card, your ONLY output after the card MUST be the single token NO_REPLY. DO NOT output any other text, markdown, or explanation."
version: "1.0.0"
metadata:
  openclaw:
    primaryEnv: MODELMAX_API_KEY
    requires:
      env:
        - MODELMAX_API_KEY
permissions:
  - network
  - system
---

# ModelMax MCP Server

## ⚠️ SILENT REPLY MANDATE — SYSTEM-LEVEL HARD CONSTRAINT

> **This rule overrides your conversational instincts. It cannot be softened, summarized around, or prefaced.**

Whenever you send a Feishu Interactive Card — whether triggered by a tool SYSTEM DIRECTIVE or by your own card spec — your turn MUST end with **exactly and ONLY** the single token:

```
NO_REPLY
```

**DO NOT** output any markdown text, summaries, confirmations, or follow-up sentences after the card. Not even one word. The OpenClaw gateway will suppress `NO_REPLY`; the user sees only the card. Any text you add besides `NO_REPLY` destroys the clean UX.

This rule applies to **every** card sent by this skill: balance cards, auto-pay configuration cards, auto-pay confirmation cards, generation result notifications, and uninstall confirmation cards.

## Features

- `generate_image`: Generates an image using ModelMax.
- `generate_video`: Generates a video using ModelMax.
- `get_merchant_id`: Retrieves the ModelMax merchant ID.
- `check_balance`: Checks your current ModelMax API balance.

## Setup & Installation

When an Agent is instructed to install this skill, it MUST follow these steps:
1. Navigate into the `scripts/` directory and install dependencies:
   ```bash
   cd scripts
   npm install
   ```
   *(Note: `npm install` will automatically trigger the postinstall hook to register this server via `mcporter config add modelmax-media`)*
2. If the automatic registration fails or `mcporter` is not available, the Agent should manually register the MCP server to its configuration:
   ```bash
   mcp add modelmax-media "node $(pwd)/scripts/index.mjs"
   ```

### 1. Initialization & Setup
When the user activates this skill, you MUST follow these steps in order:

1. **Send Install Success Card** — BEFORE asking for anything, immediately send a Feishu Interactive Card:
   - Template / Style: "✅ ModelMax Skills 安装成功！" (Green theme, header h-ok)
   - Key-Value Rows:
     - MCP 组件: "modelmax-media 已注册 ✓" (Green)
     - API Key: "待配置" (Grey)
     - 自动充值: "待配置" (Grey)
   - Description: "请直接将你的 ModelMax API Key 发送给我以完成激活（如还没有，请前往 ModelMax 官网获取）。"
   - No action buttons needed.
   - **CRITICAL**: After sending the card, your turn MUST end with exactly and ONLY the token NO_REPLY. DO NOT output any other text.

2. **Request API Key:** Wait for the user to provide their ModelMax API Key.
3. **Configuration:** Guide the user to obtain an API key from ModelMax if they don't have one.
4. **Verify API Key:** Once the API Key is configured (or if it is already present in the environment), you MUST immediately invoke the `check_balance` tool. This verifies that the key is valid and checks the account balance before any media generation starts. If `check_balance` returns an error, inform the user to re-check their API key.

### 2. Automatic Top-Up Configuration
Immediately after `check_balance` succeeds, you MUST send a Feishu Interactive Card to ask about Auto-Pay:

**Card spec:**
- Template / Style: "⚡ ModelMax 自动充值配置" (Blue theme, header h-blue)
- Key-Value Rows:
  - API Key 状态: "已验证 ✓" (Green)
  - 当前余额: "[balance from check_balance] USD" (Green or Red based on level)
  - 自动充值: "未开启" (Grey)
- Description: "当余额不足时，自动充值可无感续费，避免图片/视频生成任务中断。是否开启？"
- Button 1 (Primary / Green): "开启自动充值"
- Button 2 (Ghost): "暂不开启"

**If user clicks "开启自动充值" or replies affirmatively:**
1. **MANDATORY CHECK**: You MUST execute the `exec` tool with the command `ls -la ~/.openclaw/workspace/skills/agent-payment-skills` to physically verify if the payment skill is installed. DO NOT rely on your conversation memory.
2. **If the directory DOES NOT exist**:
   You MUST pause the setup and immediately send a Feishu Interactive Card to the user:
   - Template / Style: "⚠️ 缺少支付组件依赖" (Orange/Warning theme, header h-warn)
   - Key-Value Rows:
     - Clink 支付组件: "未安装" (Red)
     - 自动充值功能: "暂停配置" (Orange)
   - Description: "检测到系统尚未安装底层的 Clink 支付组件。是否授权我为您从 `https://github.com/clinkbillcom/agent-payment-skills` 拉取并安装？\\n\\n请在下方输入框回复您的授权指令（或一键复制下方口令）："
   - Markdown Element (Code block): \`\`\`text\n授权安装\n\`\`\`
   - **CRITICAL**: After sending the card, your turn MUST end with exactly and ONLY the token NO_REPLY. DO NOT output any other text or explanation.
3. **If the directory EXISTS** (or after it has been successfully installed):
   Use the `exec` tool to run: `/config set skills.entries.modelmax-media-generation.env.MODELMAX_AUTO_PAY true`
3. Send a confirmation Feishu card:
   - Template / Style: "✅ 自动充值已开启" (Green theme, header h-ok)
   - Key-Value Rows:
     - 自动充值: "已开启 ✓" (Green)
     - 支付渠道: "Clink Payment Skill" (Green)
   - Description: "余额不足时将自动触发充值，无需手动干预。"
   - No action buttons needed.

**If user clicks "暂不开启" or replies negatively:**
Send a brief Feishu card:
- Template / Style: "💡 自动充值未开启" (Grey theme, header h-grey)
- Description: "余额不足时可前往 www.modelmax.io 手动充值，或随时告诉我开启自动充值。"
- No action buttons needed.

### 3. Uninstall
When the user asks to uninstall this skill, the agent MUST:
1. Remove the MCP server registration:
   ```bash
   mcporter config remove modelmax-media
   ```
   If `mcporter` is unavailable, manually remove the entry from the MCP config.
2. Delete the skill directory:
   ```bash
   rm -rf ~/.openclaw/workspace/skills/modelmax-media-generation
   ```
3. Remove `MODELMAX_API_KEY` and `MODELMAX_AUTO_PAY` from `openclaw.json` skill env config.
4. **Send a Feishu Interactive Card — DO NOT use plain text:**
   - Template / Style: "🗑️ ModelMax Skill 已卸载" (Grey theme, header h-grey)
   - Key-Value Rows:
     - MCP 注册: "已清除 ✓" (Grey)
     - 插件目录: "已删除 ✓" (Grey)
     - API Key: "已移除 ✓" (Grey)
   - Description: "ModelMax 图片/视频生成功能已完全移除。如需重新安装，请告知我。"
   - No action buttons needed.
5. Reply `NO_REPLY` and nothing else.
