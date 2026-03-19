---
name: modelmax-media-generation
description: "Generate images and videos via ModelMax APIs. CRITICAL RULES: (1) INSTALL CARD MANDATE: The moment this skill finishes installing, you MUST send the install success card via exec: `node {SKILL_DIR}/scripts/send-feishu-card.mjs {SKILL_DIR}/cards/install_success.json --chat-id {current_feishu_chat_id}`. DO NOT output any plain text. After the card, reply NO_REPLY only. If the channel is NOT Feishu, skip the card and send plain text instead: 'ModelMax installed. Please send your API Key to activate.' (2) ACTIVATION ROUTING: If the user sends a ModelMax API key, including a bare message that starts with `sk-`, this skill MUST treat it as activation input, configure the key, fetch balance, and continue activation in the same turn. (3) SILENT REPLY MANDATE: After every Feishu Interactive Card, your ONLY output MUST be the single token NO_REPLY. (4) MANDATORY TOOL USE: ALWAYS call generate_image and generate_video via: npx mcporter call modelmax-media generate_image --args '{\"prompt\":\"...\"}' (do NOT omit --args). NEVER use curl or direct API calls. (5) STRICT SILENCE ON GENERATION: When generating images or videos, DO NOT output any text before the tool call, and DO NOT output any text after the tool returns. Your ONLY output MUST be the single token NO_REPLY."
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
4. **Handle pasted API Key immediately:** If the user's next message looks like a ModelMax API key (for example starts with `sk-`), you MUST treat it as the activation payload and continue the flow in the same turn. Do NOT stop after acknowledging receipt.
   - First run:
     ```bash
     /config set skills.entries.modelmax-media-generation.env.MODELMAX_API_KEY <PASTED_KEY>
     ```
   - Immediately after the config command succeeds, call `check_balance` with `send_card: false` (do NOT omit --args):
     ```bash
     npx mcporter call modelmax-media check_balance --args '{"send_card":false}'
     ```
   - Then immediately send the auto-pay configuration card using the returned balance.
   - After sending that card, reply `NO_REPLY` and nothing else.
5. **Verify API Key:** Once the API Key is configured (or if it is already present in the environment), you MUST immediately call `check_balance` with `send_card: false` (do NOT omit --args):
   ```
   npx mcporter call modelmax-media check_balance --args '{"send_card":false}'
   ```
   If `check_balance` returns an error, inform the user to re-check their API key.

### 2. Automatic Top-Up Configuration
Immediately after `check_balance` succeeds with `send_card: false`, you MUST send a card to ask about Auto-Pay:

**Feishu channel — send dynamic card via exec:**
```bash
node {SKILL_DIR}/scripts/send-feishu-card.mjs --json '<CARD_JSON>' --chat-id {current_feishu_chat_id}
```

Where `<CARD_JSON>` is the following structure with `{balance}` replaced by the actual value from `check_balance`. Use single quotes around the JSON to prevent shell interpolation:
```json
{
  "schema": "2.0",
  "header": { "title": { "content": "ModelMax 配置", "tag": "plain_text" }, "template": "blue" },
  "body": { "elements": [
    { "tag": "markdown", "content": "**API Key 状态**　<font color='green'>已验证 ✓</font>\n**当前余额**　　<font color='green'>{balance} USD</font>\n**自动充值**　　<font color='grey'>未开启</font>" },
    { "tag": "hr" },
    { "tag": "markdown", "content": "当余额不足时，自动充值可无感续费，避免图片/视频生成任务中断。默认不开启。如需开启，请在输入框回复「开启自动充值」：" },
    { "tag": "markdown", "content": "开启自动充值" }
  ]}
}
```

**Non-Feishu channel:** Send plain text: "API Key verified. Balance: ${balance} USD. Reply '开启自动充值' to enable auto top-up, or ignore to skip."

`check_balance` supports a `send_card` parameter. During activation, you MUST call it with `{"send_card":false}` so it only returns balance data and does not end the turn early. For normal user-facing balance checks, omit the parameter and let it send the standard balance card.

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

**During later 402 auto-pay recovery:**
- If a later Clink webhook wake says payment/order.succeeded and provides an `order_id`, you MUST treat that as the merchant handoff signal for the pending ModelMax recharge flow.
- If that wake also includes a `session_id`, you MUST pass it through to `check_recharge_status` so the correct pending recharge task is resumed when multiple 402 recharges are in flight in the same chat.
- Even if the payment webhook does not explicitly mention `check_recharge_status`, you MUST immediately call `check_recharge_status` with that `order_id` and optional `session_id`, wait for merchant到账 confirmation, and only then resume the original image/video task.

**If user does not reply "开启自动充值" (any other reply, or no reply, or silence):**
Do nothing — auto-pay remains disabled. Do NOT send any card. Move on.

### 3. Uninstall
When the user asks to uninstall this skill, do NOT manually chain shell commands like `mcporter config remove`, `/config delete`, `rm -rf`, or a later card send. That is fragile and can delete the files needed for the final notification.

Instead, the agent MUST call the dedicated MCP tool:

```text
uninstall_skill
```

Tool behavior:
- Removes the MCP registration for `modelmax-media`
- Removes `skills.entries.modelmax-media-generation` from `openclaw.json`
- Clears local pending ModelMax state
- Sends the uninstall confirmation card directly when a Feishu `chat_id` or `open_id` is provided
- Deletes the skill directory LAST

Execution rule:
- **Feishu channel:** call `uninstall_skill` with the current `chat_id` or `open_id` so the tool itself sends the uninstall card before self-deletion
- **Non-Feishu channel:** call `uninstall_skill`, then relay the returned plain-text completion message
- If the tool returns `NO_REPLY`, output exactly `NO_REPLY` and nothing else
