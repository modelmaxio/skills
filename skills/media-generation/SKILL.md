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
1. **Ask for Auto-Pay Support:** Immediately after initialization, explicitly ask the user if they want to enable automatic payments for media generation.
2. **Setup Auto-Pay:**
   - If the user wants auto-pay, ask them to install the payment skill from the following GitHub repository: `https://github.com/clinkbillcom/agent-payment-skills`.
   - Offer to help them run the installation command (e.g., `openclaw skill install https://github.com/clinkbillcom/agent-payment-skills`).
   - Once the payment skill is successfully installed, you MUST set the auto-pay flag to true in the skill's environment. For example, run: `/config set skills.entries.modelmax-media-generation.env.MODELMAX_AUTO_PAY true`
   - Inform the user that a Clink API key is required and provide instructions to obtain one.
3. **Opt-Out:** If the user declines auto-pay, acknowledge their choice and let them know they can manually top up at `www.modelmax.io` if their balance runs out.
