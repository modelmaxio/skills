---
name: modelmax-media-generation
description: "Generate images and videos via ModelMax APIs. CRITICAL RULES: (1) INSTALL CARD MANDATE: The moment this skill finishes installing, you MUST send the install success card via exec: `node {SKILL_DIR}/scripts/send-feishu-card.mjs {SKILL_DIR}/cards/install_success.json --chat-id {current_feishu_chat_id}`. DO NOT output any plain text. After the card, reply NO_REPLY only. If the channel is NOT Feishu, skip the card and send plain text instead: 'ModelMax installed. Please send your API Key to activate.' (2) Immediately upon receiving the API Key, call `check_balance`. (3) SILENT REPLY MANDATE: After every Feishu Interactive Card, your ONLY output MUST be the single token NO_REPLY. (4) MANDATORY TOOL USE: ALWAYS call generate_image and generate_video via: npx mcporter call modelmax-media generate_image --args '{\"prompt\":\"...\"}' (do NOT omit --args). NEVER use curl or direct API calls. (5) STRICT SILENCE ON GENERATION: When generating images or videos, DO NOT output any text before the tool call, and DO NOT output any text after the tool returns. Your ONLY output MUST be the single token NO_REPLY."
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

## 🚫 ALWAYS USE mcporter — NEVER CALL API DIRECTLY

> **ALWAYS call `generate_image` and `generate_video` via `npx mcporter call`. Do NOT omit `--args`. NEVER use `curl`, `exec`, or any shell command to call the ModelMax API directly.**

```bash
# Generate image — delivers directly to Feishu
npx mcporter call modelmax-media generate_image --args '{"prompt":"<PROMPT>","chat_id":"<CHAT_ID>"}'

# Generate video — delivers directly to Feishu
npx mcporter call modelmax-media generate_video --args '{"prompt":"<PROMPT>","resolution":"720p","duration_seconds":5,"chat_id":"<CHAT_ID>"}'
```

Note: 1080p and 4k resolution videos MUST use `duration_seconds: 8`.

Whenever you send a Feishu Interactive Card — whether triggered by a tool SYSTEM DIRECTIVE or by your own card spec — your turn MUST end with **exactly and ONLY** the single token:

```
NO_REPLY
```

**DO NOT** output any markdown text, summaries, confirmations, or follow-up sentences after the card. Not even one word. The OpenClaw gateway will suppress `NO_REPLY`; the user sees only the card. Any text you add besides `NO_REPLY` destroys the clean UX.

This rule applies to **every** card sent by this skill: balance cards, auto-pay configuration cards, auto-pay confirmation cards, generation result notifications, and uninstall confirmation cards.

## Sending Feishu Cards

This skill includes a standalone card-sending script that requires no external dependencies:

```bash
# Send a static card file
node {SKILL_DIR}/scripts/send-feishu-card.mjs {SKILL_DIR}/cards/install_success.json --chat-id oc_xxx

# Send dynamic card (inline JSON)
node {SKILL_DIR}/scripts/send-feishu-card.mjs --json '{"config":{},"header":{},"elements":[]}' --chat-id oc_xxx

# Send to a user (open_id)
node {SKILL_DIR}/scripts/send-feishu-card.mjs {SKILL_DIR}/cards/install_success.json --open-id ou_xxx
```

## Sending Feishu Images and Videos

Use `send-feishu-media.mjs` to upload and send images/videos to Feishu. Images are uploaded via the Feishu image API and rendered inline (not as a file attachment). Videos are uploaded as files.

```bash
# Send image (renders inline in Feishu)
node {SKILL_DIR}/scripts/send-feishu-media.mjs /path/to/image.png --chat-id oc_xxx

# Send video
node {SKILL_DIR}/scripts/send-feishu-media.mjs /path/to/video.mp4 --chat-id oc_xxx
```

**IMPORTANT:** When `generate_image` or `generate_video` returns a SYSTEM DIRECTIVE with a file path, you MUST use `send-feishu-media.mjs` (via exec) to deliver it. DO NOT use the `message` tool — it sends files as generic attachments and images will not render inline.

Replace `{SKILL_DIR}` with the actual skill directory path (e.g. `~/.openclaw/workspace/skills/modelmax-media-generation`).

**Non-Feishu channels:** If the current channel is not Feishu, skip all card-sending steps and use plain text equivalents instead.


## Features

- `generate_image`: Generates an image using ModelMax. Saves to `~/.openclaw/tmp/`. After it returns a SYSTEM DIRECTIVE, run `send-feishu-media.mjs` via exec to deliver the image inline.
- `generate_video`: Generates a video using ModelMax. Saves to `~/.openclaw/tmp/`. After it returns a SYSTEM DIRECTIVE, run `send-feishu-media.mjs` via exec to deliver the video.
- `get_merchant_id`: Retrieves the ModelMax merchant ID.
- `check_balance`: Checks your current ModelMax API balance.

## Setup & Installation

When an Agent is instructed to install this skill, it MUST follow these steps:
1. Register the MCP server:
   ```bash
   mcporter config add modelmax-media "node {SKILL_DIR}/scripts/index.bundle.mjs"
   ```
2. If `mcporter` is not available, register manually:
   ```bash
   mcp add modelmax-media "node $(pwd)/scripts/index.bundle.mjs"
   ```

### 1. Initialization & Setup
When the user activates this skill, you MUST follow these steps in order:

1. **Register MCP:**
   ```bash
   mcporter config add modelmax-media "node {SKILL_DIR}/scripts/index.bundle.mjs" 2>/dev/null || true
   ```

2. **Send install success card (Feishu only):**
   ```bash
   node {SKILL_DIR}/scripts/send-feishu-card.mjs {SKILL_DIR}/cards/install_success.json --chat-id {current_feishu_chat_id}
   ```

   **Non-Feishu channel:** Send plain text: "✅ ModelMax Skills installed. Please send your ModelMax API Key to activate."

   **CRITICAL**: After sending the card, your turn MUST end with exactly and ONLY the token NO_REPLY.

3. **Request API Key:** Wait for the user to provide their ModelMax API Key. Guide them to [ModelMax](https://www.modelmax.io/dashboard/keys) if they don't have one.
4. **Verify API Key:** Once the API Key is configured (or if it is already present in the environment), you MUST immediately call `check_balance` (do NOT omit --args):
   ```
   npx mcporter call modelmax-media check_balance --args '{}'
   ```
   If `check_balance` returns an error, inform the user to re-check their API key.

### 2. Automatic Top-Up Configuration
Immediately after `check_balance` succeeds, you MUST send a card to ask about Auto-Pay:

**Feishu channel — send dynamic card via exec:**
```bash
node {SKILL_DIR}/scripts/send-feishu-card.mjs --json '<CARD_JSON>' --chat-id {current_feishu_chat_id}
```

Where `<CARD_JSON>` is the following structure with `{balance}` replaced by the actual value from `check_balance`. Use single quotes around the JSON to prevent shell interpolation:
```json
{
  "schema": "2.0",
  "header": { "title": { "content": "⚡ ModelMax 自动充值配置", "tag": "plain_text" }, "template": "blue" },
  "body": { "elements": [
    { "tag": "markdown", "content": "**API Key 状态**　<font color='green'>已验证 ✓</font>\n**当前余额**　　<font color='green'>{balance} USD</font>\n**自动充值**　　<font color='grey'>未开启</font>" },
    { "tag": "hr" },
    { "tag": "markdown", "content": "当余额不足时，自动充值可无感续费，避免图片/视频生成任务中断。默认不开启。如需开启，请在输入框回复「开启自动充值」：" },
    { "tag": "markdown", "content": "```\n开启自动充值\n```" }
  ]}
}
```

**Non-Feishu channel:** Send plain text: "API Key verified. Balance: ${balance} USD. Reply '开启自动充值' to enable auto top-up, or ignore to skip."

**Default behavior: do NOT enable auto-pay.** Only proceed if the user explicitly replies with the exact text "开启自动充值".

**If user replies "开启自动充值":**
1. **MANDATORY CHECK**: You MUST execute the `exec` tool with the command `ls -la ~/.openclaw/workspace/skills/agent-payment-skills` to physically verify if the payment skill is installed. DO NOT rely on your conversation memory.
2. **If the directory DOES NOT exist**:
   - **Feishu channel:** Run:
     ```bash
     node {SKILL_DIR}/scripts/send-feishu-card.mjs {SKILL_DIR}/cards/missing_payment_skill.json --chat-id {current_feishu_chat_id}
     ```
   - **Non-Feishu channel:** Send plain text: "⚠️ Clink payment component not installed. Please install from https://github.com/clinkbillcom/agent-payment-skills"
   - **CRITICAL**: After sending the card, your turn MUST end with exactly and ONLY the token NO_REPLY. DO NOT output any other text or explanation.
   - Follow the `agent-payment-skills` installation flow completely (pre_install → restart → wallet init + card binding).
   - Once initialization is confirmed complete, you MUST inject this context update into the current flow before proceeding: `agent-payment-skills is now installed and initialized for this user; wallet and card setup completed; resume the pending 402 auto-pay flow now.`
   - After that context update is established, proceed to step 3 immediately. Do NOT restart the install check loop.
3. **If the directory EXISTS** (or after it has been successfully installed and initialized per step 2):
   - Call `agent-payment-skills.pre_check_account` (do NOT omit --args):
     ```
     npx mcporter call agent-payment-skills pre_check_account --args '{}'
     ```
   - **If pre_check_account fails** (wallet not initialized or no card bound): Follow the `agent-payment-skills` initialization instructions to fix the issue (initialize wallet / bind card) before proceeding. DO NOT set the env var until pre-check passes.
   - **If pre_check_account passes**: IMMEDIATELY use the `exec` tool to run: `/config set skills.entries.modelmax-media-generation.env.MODELMAX_AUTO_PAY true`
   - After the exec command succeeds, **immediately** send ONE final confirmation card:
     - **Feishu channel:** Run:
       ```bash
       node {SKILL_DIR}/scripts/send-feishu-card.mjs {SKILL_DIR}/cards/autopay_enabled.json --chat-id {current_feishu_chat_id}
       ```
     - **Non-Feishu channel:** Send plain text: "✅ Auto top-up enabled. Your account will be recharged automatically when balance runs low."
   - After sending this card, reply NO_REPLY and nothing else.

**If user does not reply "开启自动充值" (any other reply, or no reply, or silence):**
Do nothing — auto-pay remains disabled. Do NOT send any card. Move on.

### 3. Uninstall
When the user asks to uninstall this skill, the agent MUST execute the following steps in order:

1. **Remove MCP registration from openclaw:**
   ```bash
   mcporter config remove modelmax-media
   ```
2. **Remove skill entry from `openclaw.json`** (removes API Key, AUTO_PAY, and all config):
   ```bash
   /config delete skills.entries.modelmax-media-generation
   ```
3. **Delete the skill directory:**
   ```bash
   rm -rf ~/.openclaw/workspace/skills/modelmax-media-generation
   ```
4. **Send uninstall confirmation:**
   - **Feishu channel:** Run:
     ```bash
     node {SKILL_DIR}/scripts/send-feishu-card.mjs {SKILL_DIR}/cards/uninstall_success.json --chat-id {current_feishu_chat_id}
     ```
   - **Non-Feishu channel:** Send plain text: "🗑️ ModelMax skill has been fully removed. MCP registration cleared, directory deleted, config removed from openclaw.json."
5. Reply `NO_REPLY` and nothing else.
