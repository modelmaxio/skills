---
name: modelmax-skills
description: Universal agent skill to interact with ModelMax for image/video generation, and handle auto-topups via clink-skills.
version: "1.0.0"
metadata: {"openclaw": {"primaryEnv": "MODELMAX_API_KEY", "requires": {"env": ["MODELMAX_API_KEY"]}}}
dependencies:
  - clink-skills
permissions:
  - network
  - system
tools:
  - name: get_merchant_id
    description: Call the ModelMax API to retrieve the current merchant ID.
  - name: generate_image
    description: Call the ModelMax image generation model to generate an image.
  - name: generate_video
    description: Call the ModelMax video generation model to generate a video.
  - name: list_models
    description: Fetch the list of supported models and the current merchant_id.
  - name: select_default_models
    description: Select the default models for video and image generation.
  - name: check_balance
    description: Check the current balance of the user's ModelMax account.
  - name: clink_pay
    description: Call the clink skill to execute a payment given a merchant_id and amount.
---

# ModelMax Skill

This skill empowers any compatible AI agent to interact with ModelMax APIs, generating images and videos, while seamlessly managing account balances and automated top-ups via the Clink skill.

## 🤖 Instructions & Workflows

### 0. Initialization & Setup
When the user installs or initializes the `modelmax-skills`:
1. **Request API Key:** Explicitly ask the user to provide their ModelMax API Key to authenticate requests.
2. **Configuration:** Instruct the user on how to obtain the API key if they don't have one, and store the provided key securely for subsequent API calls to `https://api.modelmax.io`.

### 1. Automatic Top-Up Configuration
1. **Ask for Auto-Pay Support:** Ask the user if they want to enable automatic payments.
2. **Verify Clink Skill:** 
   - Check if the user has installed the `clink` skill.
   - If not installed, automatically help the user install the `clink` skill.
   - Inform the user that an API key is required for installation, and provide them with instructions on how to obtain it.

### 2. Merchant ID Retrieval
- Invoke the ModelMax API to get the current merchant ID (`merchant_id`).

### 3. Media Generation
- **Image Generation:** Call the ModelMax image generation API (e.g., `/v1/images/generations` using gemini-3.1-flash-image-preview) to generate images.
- **Video Generation:** Call the ModelMax async video generation queue (e.g., `/v1/queue/veo-3.1`) to generate videos. Veo 3.1 can also directly generate 720p, 1080p or 4k videos.

### 4. Model Listing & Configuration
- Fetch and display the list of supported models and the current `merchant_id`.
- Allow the user to configure and select their **default video model** and **default image model**.

### 5. Insufficient Balance Handling
If the account balance is insufficient during any operation:
- **Case A: No Auto-Payment Configured:** Prompt the user to manually top up by providing the official ModelMax top-up link.
- **Case B: Auto-Payment Configured:** Directly invoke the `clink` skill to execute a payment. Pass the `merchant_id` and the `amount` to the clink payment tool.
- **Post-Top-Up:** After the top-up is completed, retrieve and display the latest balance to the user.

---

## 🔌 API Integration Reference

Base URL: `https://api.modelmax.io`

- **List Models:** `GET /v1/models`
- **Images Generations:** `POST /v1/images/generations`
  - Body: `{"model": "gemini-3.1-flash-image-preview", "prompt": "...", "n": 1, "size": "1024x1024"}`
- **Submit Video Task:** `POST /v1/queue/veo-3.1`
  - Body: `{"prompt": "...", "parameters": {"aspect_ratio": "16:9", "resolution": "1080p", "duration_seconds": 8, "generate_audio": true}}`
- **Check Task Status:** `GET /v1/queue/veo-3.1/requests/:requestID/status`
- **Get Task Result:** `GET /v1/queue/veo-3.1/requests/:requestID`
- **Download Video Content:** `GET /v1/queue/veo-3.1/requests/:requestID/content/:index`
