# ModelMax Skills for OpenClaw

An OpenClaw-compatible AI agent skill pack that empowers agents to seamlessly interact with ModelMax APIs. This skill allows agents to autonomously generate high-quality images and videos, while also managing account balances and automatic top-ups.

## ✨ Features

- **Image Generation:** Generate stunning images using the `gemini-3.1-flash-image-preview` model.
- **Video Generation:** Create cinematic videos using Google's **Veo 3.1** model. Supports:
  - Resolutions up to 4K (720p, 1080p, 4K).
  - 16:9 and 9:16 aspect ratios.
  - Image-to-Video generation using start and end frames (`start_image_url`, `end_image_url`).
  - Dynamic, intelligent polling that scales according to the requested video duration.
- **Automatic Top-Up:** Deep integration with `clink-skills`. If the agent encounters an "insufficient balance" error during media generation, it will automatically initiate a top-up workflow using Clink, ensuring uninterrupted service.

## 📦 Installation

### Option 1: Using ClawHub (Recommended)
If you have ClawHub CLI installed, simply run:
```bash
clawhub install modelmax-skills
```

### Option 2: Manual Installation
1. Clone or download this repository.
2. Place the `modelmax-skills` folder into your OpenClaw workspace's `skills` directory (e.g., `~/.openclaw/workspace/skills/`).

## ⚙️ Configuration

This skill requires a ModelMax API key to function. 

OpenClaw handles configuration seamlessly. When installing via UI or running the agent for the first time, it will prompt you for the API key because it is declared as a `primaryEnv` dependency in `SKILL.md`.

Alternatively, you can manually configure it in your `~/.openclaw/openclaw.json` file:

```json
{
  "skills": {
    "entries": {
      "modelmax-skills": {
        "enabled": true,
        "apiKey": "sk-your-modelmax-api-key"
      }
    }
  }
}
```

Or, export it as a global environment variable before starting the OpenClaw Gateway:
```bash
export MODELMAX_API_KEY="sk-your-modelmax-api-key"
```

## 🛠️ Usage

Once installed and configured, you can simply ask your OpenClaw agent in natural language:

- *"Generate an image of a cybernetic cat reading a book in a neon-lit alley."*
- *"Create an 8-second 1080p video using this image as the start frame: [URL]"*
- *"I need a 4K video in 16:9 aspect ratio showing a time-lapse of a sunset over a futuristic city."*

The agent will automatically determine the best parameters, invoke the tools, wait for the generation to complete, and render the final media inline in your chat interface.

## 🔒 Dependencies
- [clink-skills](https://clawhub.com/skills/clink-skills) (Automatically suggested for handling payments/top-ups).

## 📄 License
MIT
