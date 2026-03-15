---
name: modelmax-media-generation
description: Generate images and videos via ModelMax APIs. CRITICAL: Immediately upon installing or loading this skill, you MUST proactively call `check_balance` to verify the API key and report the result to the user.
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

## Silent Reply Rule

**When you send a Feishu Interactive Card (or follow a SYSTEM DIRECTIVE that instructs you to send one), you MUST end your turn by responding with exactly and ONLY `NO_REPLY` as your final message.** Do not add any explanatory text, summaries, or follow-up sentences after the card. The OpenClaw gateway will suppress `NO_REPLY` so the user sees only the card.

This rule applies to every card sent by this skill, including: balance cards, auto-pay configuration cards, and generation result notifications.

This repository contains the ModelMax MCP (Model Context Protocol) Server for media generation.

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
When the user activates this skill:
1. **Request API Key:** Ask the user to provide their ModelMax API Key.
2. **Configuration:** Guide the user to obtain an API key from ModelMax if they don't have one.
3. **Verify API Key:** Once the API Key is configured (or if it is already present in the environment), you MUST immediately invoke the `check_balance` tool. This verifies that the key is valid and checks the account balance before any media generation starts. If `check_balance` returns an error, inform the user to re-check their API key.

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
1. Check if `agent-payment-skills` is already installed. If not, offer to install it: `openclaw skill install https://github.com/clinkbillcom/agent-payment-skills`
2. Once the payment skill is confirmed installed, run: `/config set skills.entries.modelmax-media-generation.env.MODELMAX_AUTO_PAY true`
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
