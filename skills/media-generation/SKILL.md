---
name: modelmax-media-generation
description: Generate images and videos via ModelMax APIs (Gemini Flash Image, Veo 3.1), with automatic balance checking and auto top-up through agent-payment-skills.
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
tools:
  - name: get_merchant_id
    description: Retrieve the ModelMax merchant ID for payment integration.
  - name: generate_image
    description: Generate an image using ModelMax (Gemini 3.1 Flash Image Preview).
  - name: generate_video
    description: Generate a video using ModelMax (Veo 3.1). Supports 720p/1080p/4K, 16:9 or 9:16, and image-to-video.
  - name: check_balance
    description: Check the current balance of the user's ModelMax account.
---

# Media Generation Skill

Generate images and videos through ModelMax APIs, with seamless balance management and automatic top-ups via the Clink payment skill.

### ⚠️ Execution Directives (Strong Constraints)
Because generating high-resolution (4K) or 8s+ videos can take an extended period of time (>3 minutes):
1. **No Blocking**: The main agent must NEVER synchronously invoke `generate_video` or `generate_image` and wait for the result in the current chat session.
2. **Mandatory Subagent Spawn**: When the user requests video or image generation, the main agent MUST spawn a subagent using a tool like `sessions_spawn` (if available in the environment) with `runtime="subagent"` and `mode="run"`.
3. **Immediate Acknowledgment**: After spawning the task, the main agent must immediately inform the user: "Your request has been sent to the background processor. Please wait a moment while it renders. We can continue chatting in the meantime."
4. **Subagent Delivery**: Once the subagent finishes rendering the media, it MUST independently deliver the video/image to the user's channel (e.g., using the `message` tool with `action="send"`).

## Instructions & Workflows

### 0. Initialization & Setup
When the user activates this skill:
1. **Request API Key:** Ask the user to provide their ModelMax API Key.
2. **Configuration:** Guide the user to obtain an API key from ModelMax if they don't have one. The key is used to authenticate all requests to `https://api.modelmax.io`.
3. **Verify API Key:** Once the API Key is configured (or if it is already present in the environment), you MUST immediately invoke the `check_balance` tool. This verifies that the key is valid and checks the account balance before any media generation starts. If `check_balance` returns an error (like HTTP 401 Unauthorized), inform the user and ask them to re-check and re-configure their API key.

### 1. Automatic Top-Up Configuration
1. **Ask for Auto-Pay Support:** After initialization, explicitly ask the user if they want to enable automatic payments for media generation.
2. **Install Clink Skill:**
   - If the user wants auto-pay, ask them to install the payment skill from the following GitHub repository: `https://github.com/clinkbillcom/agent-payment-skills`.
   - Offer to help them run the installation command (e.g., `openclaw skill install https://github.com/clinkbillcom/agent-payment-skills`).
   - Once installed, inform the user that a Clink API key is required and provide instructions to obtain one.

### 2. Image Generation
- Call the ModelMax image generation API (`POST /v1/images/generations`) using the `gemini-3.1-flash-image-preview` model.
- Default size: `1024x1024`.
- If the API returns a Base64 image, save it locally and return a relative URL.

### 3. Video Generation
- Submit an async video generation task (`POST /v1/queue/veo-3.1`) using Google Veo 3.1.
- Supported parameters:
  - **Resolution:** 720p, 1080p, 4K (1080p and 4K require exactly 8 seconds duration).
  - **Aspect ratio:** 16:9 or 9:16.
  - **Audio:** Optional audio generation.
  - **Image-to-Video:** Provide `start_image_url` and/or `end_image_url` for guided generation.
- Poll the task status endpoint until completion, then download and serve the video locally.

### 4. Insufficient Balance Handling
If the account balance is insufficient (HTTP 402) during any generation:
- **No Auto-Payment:** Prompt the user to manually top up via the ModelMax dashboard.
- **Auto-Payment Enabled:** Automatically invoke `get_merchant_id`, then call the `clink_pay` tool from agent-payment-skills with the `merchant_id` and a default top-up amount. Retry the generation after successful payment.
- **Post-Top-Up:** Retrieve and display the latest balance to the user.

---

## API Reference

Base URL: `https://api.modelmax.io`

| Endpoint | Method | Description |
|---|---|---|
| `/v1/images/generations` | POST | Generate an image |
| `/v1/config` | GET | Get merchant ID and balance |
| `/v1/queue/veo-3.1` | POST | Submit a video generation task |
| `/v1/queue/veo-3.1/requests/:id` | GET | Check task status / get result |
| `/v1/queue/veo-3.1/requests/:id/content/:index` | GET | Download video content |
