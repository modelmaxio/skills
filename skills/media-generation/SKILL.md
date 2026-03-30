---
name: modelmax-media-generation
description: "Generate images and videos via ModelMax APIs. CRITICAL RULES: (1) INSTALL NOTIFICATION MANDATE: The moment this skill finishes installing, you MUST send exactly one install success notification appropriate for the current channel. Feishu may use `send-message.mjs` with a card payload; other channels should receive an equivalent markdown/text notification. (2) ACTIVATION ROUTING: If the user sends a ModelMax API key, including a bare message that starts with `sk-`, this skill MUST treat it as activation input, configure the key, fetch balance, and continue activation in the same turn. (3) MANDATORY TOOL USE: ALWAYS call generate_image and generate_video via mcporter with the explicit config path under `~/.openclaw/config/mcporter.json` (do NOT omit `--args`). NEVER use curl or direct API calls."
version: "1.0.0"
metadata:
  openclaw:
    scriptsDir: "scripts"
    tools:
      notification_sender: "scripts/send-message.mjs"
      mcp_server: "scripts/index.bundle.mjs"
    primaryEnv: MODELMAX_API_KEY
    requires:
      env:
        - MODELMAX_API_KEY
permissions:
  - network
  - system
---

# ModelMax MCP Server

## 🚫 ALWAYS USE mcporter — NEVER CALL API DIRECTLY

> **ALWAYS call `generate_image` and `generate_video` via `npx mcporter --config "$MCPORTER_CONFIG_PATH" call`. Do NOT omit `--args`. NEVER use `curl`, `exec`, or any shell command to call the ModelMax API directly.**

```bash
MCPORTER_CONFIG_PATH="${OPENCLAW_HOME:-$HOME}/.openclaw/config/mcporter.json"

# Generate image
npx mcporter --config "$MCPORTER_CONFIG_PATH" call modelmax-media generate_image --args '{"prompt":"<PROMPT>","channel":"feishu","target_id":"<CHAT_ID>","target_type":"chat_id"}'

# Generate video
npx mcporter --config "$MCPORTER_CONFIG_PATH" call modelmax-media generate_video --args '{"prompt":"<PROMPT>","resolution":"720p","duration_seconds":5,"channel":"feishu","target_id":"<CHAT_ID>","target_type":"chat_id"}'
```

Note: 1080p and 4k resolution videos MUST use `duration_seconds: 8`.

After sending a notification or media item, you may continue with a short natural-language reply when the surrounding workflow needs it. Do not force `NO_REPLY` unless a specific tool result explicitly requires it.

## Card Ownership Matrix (Hard Rule)

Exactly one layer owns each semantic card. Do NOT duplicate card delivery.

| Event | Owner | Required behavior |
|---|---|---|
| Install complete | agent | Send exactly one install success notification |
| API key activation summary | agent | Send exactly one configuration/auto-pay prompt notification |
| Balance check with `send_card:false` | tool | Returns data only; agent must decide the next notification |
| Payment-layer `✅ 支付成功` | payment skill | ModelMax skill MUST NOT send another payment-success notification |
| `check_recharge_status` credited/paid | modelmax tool | Tool owns `✅ 充值成功` and pending-task resume |
| `check_recharge_status` failed/refunded | modelmax tool | Tool owns `❌ 充值失败` |
| Generated image/video delivery | modelmax tool + `send-message.mjs` | Tool delivers directly through the unified sender |

## Merchant Result Ownership (Hard Rule)

For ModelMax, `check_recharge_status` is the only owner of merchant-layer recharge result notifications.

- No other layer may send `✅ 充值成功` for the same `order_id`.
- No other layer may send `❌ 充值失败` for the same `order_id`.
- Payment-layer `✅ 支付成功` belongs to the payment skill, not ModelMax.

## Tool Return Contract (Hard Rule)

- `DIRECT_SEND`
  - Meaning: the tool already sent the notification/media
  - Agent MUST NOT send a duplicate semantic-equivalent notification/media
- `EXEC_REQUIRED`
  - Meaning: the tool returned an explicit exec command
  - Agent MUST execute it exactly once
- `DATA_ONLY`
  - Meaning: the tool returned data only
  - Agent may send the next required notification defined by this skill
- `NO_REPLY`
  - Meaning: preserve exactly; do not append text, cards, or retries

## Prohibited Behaviors (Hard Rule)

- Do NOT send `✅ 充值成功` before `check_recharge_status` confirms `credited=true` or `status=paid`.
- Do NOT send a second `✅ 充值成功` or `❌ 充值失败` notification for the same `order_id`.
- Do NOT send a payment-layer `✅ 支付成功` notification from ModelMax; that belongs to the payment skill.
- Do NOT infer recovery state from chat memory when `pending-auto-pay-task.json` or tool output is available.
- Do NOT paraphrase the full notification contents after the notification is already sent.

## Amount Selection Rule (Hard Rule)

There are only two valid amount sources for ModelMax recharge:

1. User override
   - If the user explicitly provides a concrete recharge amount in the current turn, you MUST use that amount.
   - This user-specified amount overrides the merchant default.

2. Merchant default
   - If the user does not explicitly provide a concrete recharge amount in the current turn, you MUST call `get_payment_config` and use the returned `default_amount` exactly as-is.

You MUST NOT invent a third amount from memory, prior turns, habit, or judgment.
You MUST NOT replace the merchant default with `1`, `5`, or any other arbitrary amount unless the user explicitly asked for that amount in the current turn.

## Merchant Payment Handoff Contract

ModelMax should drive its own Clink payment flow and call `agent-payment-skills.clink_pay` directly.

- For session-mode flows, pass:
  - `sessionId`
  - `merchant_integration: {"server":"modelmax-media","confirm_tool":"check_recharge_status","confirm_args":{}}`
- For direct-mode flows, call `get_payment_config` first, then pass:
  - `merchant_id`
  - `amount`
  - `currency`
  - `merchant_integration: {"server":"modelmax-media","confirm_tool":"check_recharge_status","confirm_args":{}}`

## Sending Notifications

This skill includes a standalone notification sender:

```bash
# Send a Feishu card payload
node {SKILL_DIR}/scripts/send-message.mjs --payload '{"channel":"feishu","target":{"type":"chat_id","id":"oc_xxx"},"card":{"config":{},"header":{},"elements":[]}}'

# Send an equivalent markdown/text notification to another channel
node {SKILL_DIR}/scripts/send-message.mjs --payload '{"channel":"telegram","target":{"type":"target_id","id":"12345"},"text":"✅ ModelMax installed. Please send your API Key to activate."}'
```

## Features

- `generate_image`: Generates an image using ModelMax and delivers it directly through `send-message.mjs`.
- `generate_video`: Generates a video using ModelMax and delivers it directly through `send-message.mjs`.
- `get_payment_config`: Retrieves the ModelMax payment config: `merchant_id`, `default_amount`, and `currency`.
- `check_balance`: Checks your current ModelMax API balance.

## Setup & Installation

When an Agent is instructed to install this skill, it MUST follow these steps:
1. Register the MCP server:
   ```bash
   mcporter --config "$MCPORTER_CONFIG_PATH" config add modelmax-media "node {SKILL_DIR}/scripts/index.bundle.mjs"
   ```
2. If `mcporter` is not available, register manually:
   ```bash
   mcp add modelmax-media "node $(pwd)/scripts/index.bundle.mjs"
   ```

### 1. Initialization & Setup
When the user activates this skill, you MUST follow these steps in order:

1. **Register MCP:**
   ```bash
   mcporter --config "$MCPORTER_CONFIG_PATH" config add modelmax-media "node {SKILL_DIR}/scripts/index.bundle.mjs" 2>/dev/null || true
   ```

2. **Send install success notification:**
   - Feishu may use `send-message.mjs` with the `install_success.json` card payload.
   - Other channels should receive the equivalent text: "✅ ModelMax Skills installed. Please send your ModelMax API Key to activate."
   - After sending the notification, you may continue with a short natural-language reply.

3. **Request API Key:** Wait for the user to provide their ModelMax API Key. Guide them to [ModelMax](https://uat-www.modelmax.io/dashboard/keys) if they don't have one.
4. **Handle pasted API Key immediately:** If the user's next message looks like a ModelMax API key (for example starts with `sk-`), you MUST treat it as the activation payload and continue the flow in the same turn. Do NOT stop after acknowledging receipt.
   - First run:
     ```bash
     /config set skills.entries.modelmax-media-generation.env.MODELMAX_API_KEY <PASTED_KEY>
     ```
   - Immediately after the config command succeeds, call `check_balance` with `send_card: false` (do NOT omit --args):
     ```bash
     npx mcporter --config "$MCPORTER_CONFIG_PATH" call modelmax-media check_balance --args '{"send_card":false}'
     ```
   - Then immediately send exactly one auto-pay configuration notification using the returned balance.
   - After sending that notification, you may continue with a short natural-language reply.
5. **Verify API Key:** Once the API Key is configured (or if it is already present in the environment), you MUST immediately call `check_balance` with `send_card: false` (do NOT omit --args):
   ```
   npx mcporter --config "$MCPORTER_CONFIG_PATH" call modelmax-media check_balance --args '{"send_card":false}'
   ```
   If `check_balance` returns an error, inform the user to re-check their API key.

### 2. Automatic Top-Up Configuration
Immediately after `check_balance` succeeds with `send_card: false`, you MUST send a notification to ask about Auto-Pay:

**Feishu channel — you may send a structured card notification:**
```bash
node {SKILL_DIR}/scripts/send-message.mjs --payload '{"channel":"feishu","target":{"type":"chat_id","id":"<TARGET_ID>"},"card":<CARD_JSON>}'
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

**Non-Feishu channel:** Send equivalent markdown/text: "API Key verified. Balance: ${balance} USD. Reply '开启自动充值' to enable auto top-up, or ignore to skip."

`check_balance` supports a `send_card` parameter. During activation, you MUST call it with `{"send_card":false}` so it only returns balance data and does not end the turn early. For normal user-facing balance checks, omit the parameter and let it send the standard balance notification.

Important:
- `send_card:false` means `DATA_ONLY`
- When `send_card:false`, `check_balance` MUST NOT send any balance notification
- In that mode, the agent owns the next configuration notification
- In normal balance-check mode, if the tool direct-sends the balance notification, the agent MUST NOT send a second balance notification

**Default behavior: do NOT enable auto-pay.** Only proceed if the user explicitly replies with the exact text "开启自动充值".

**If user replies "开启自动充值":**
1. **MANDATORY CHECK**: You MUST execute the `exec` tool with the command `ls -la ~/.openclaw/workspace/skills/agent-payment-skills` to physically verify if the payment skill is installed. DO NOT rely on your conversation memory.
2. **If the directory DOES NOT exist**:
   - Send one notification that Clink payment component is not installed and include the install URL: `https://github.com/clinkbillcom/agent-payment-skills`
   - After sending the notification, you may continue with a short natural-language reply.
   - Follow the `agent-payment-skills` installation flow completely (pre_install → restart → wallet init + card binding).
   - Once initialization is confirmed complete, you MUST inject this context update into the current flow before proceeding: `agent-payment-skills is now installed and initialized for this user; wallet and card setup completed; resume the pending 402 auto-pay flow now.`
   - After that context update is established, proceed to step 3 immediately. Do NOT restart the install check loop.
3. **If the directory EXISTS** (or after it has been successfully installed and initialized per step 2):
   - Call `agent-payment-skills.pre_check_account` (do NOT omit --args):
     ```
     npx mcporter --config "$MCPORTER_CONFIG_PATH" call agent-payment-skills pre_check_account --args '{}'
     ```
   - **If pre_check_account fails** (wallet not initialized or no card bound): Follow the `agent-payment-skills` initialization instructions to fix the issue (initialize wallet / bind card) before proceeding. DO NOT set the env var until pre-check passes.
   - **If pre_check_account passes**: IMMEDIATELY use the `exec` tool to run: `/config set skills.entries.modelmax-media-generation.env.MODELMAX_AUTO_PAY true`
   - After the exec command succeeds, **immediately** send ONE final confirmation notification:
     - Feishu may use the `autopay_enabled.json` card payload through `send-message.mjs`
     - Other channels should receive: "✅ Auto top-up enabled. Your account will be recharged automatically when balance runs low."
   - After sending this notification, you may continue with a short natural-language reply.

**During later 402 auto-pay recovery:**
- `payment handoff` means the payment layer has confirmed successful payment and provided a structured `payment_handoff` payload for merchant到账确认.
- For session-based recovery, call `agent-payment-skills.clink_pay` with `sessionId` and `merchant_integration`.
- For direct-mode recovery, call `get_payment_config` first, then call `agent-payment-skills.clink_pay` with `merchant_id`, `amount`, `currency`, and `merchant_integration`.
- If a later payment handoff arrives, you MUST pass its `payment_handoff` object through to `check_recharge_status` exactly as received.

### 402 Recovery Contract (Hard Rule)

After payment handoff:
1. Call `check_recharge_status` exactly once.
2. If `check_recharge_status` direct-sent `✅ 充值成功`, do NOT send another recharge-success notification.
3. If `check_recharge_status` direct-sent `❌ 充值失败`, do NOT send another failure notification.
4. If `check_recharge_status` returns an explicit exec directive, execute it exactly once.
5. Resume the pending image/video task only after recharge confirmation succeeds.

- Current implementation persists pending auto-pay tasks under `~/.openclaw/state/modelmax-media/pending-auto-pay-task.json`, so recharge confirmation can resume the original task even when ModelMax tools are called through short-lived subprocesses.
- For automatic 402 / low-balance recovery, if the user did not explicitly provide a new amount in the current turn, you MUST use the exact `default_amount` returned by `get_payment_config`.

**If user does not reply "开启自动充值" (any other reply, or no reply, or silence):**
Do nothing — auto-pay remains disabled. Do NOT send any additional notification. Move on.

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
- Sends the uninstall confirmation notification directly when a notify target is provided
- Deletes the skill directory LAST

Execution rule:
- Call `uninstall_skill` with the current notify target when available so the tool itself can send the uninstall notification before self-deletion.
- If no direct target is available, call `uninstall_skill`, then relay the returned completion message.
- If a tool explicitly returns `NO_REPLY`, preserve it as-is; otherwise you may continue with a short natural-language reply after notifications or media.
