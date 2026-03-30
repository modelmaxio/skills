# ModelMax Skills

English | [简体中文](README-zh.md)

ModelMax Skills adds image generation, video generation, balance checks, and optional auto top-up to OpenClaw agents.

---

## What You Can Do

After installation, you can ask your agent to:

- Generate images from text prompts
- Generate videos from text prompts or input images
- Check your current ModelMax balance
- Auto top up and resume tasks when balance is low

Examples:

- `Generate a cyberpunk cat illustration`
- `Create an 8-second 1080p sunset video`
- `Use this image as the first frame for a 16:9 video`
- `Check my ModelMax balance`

---

## Video Limits

- Default resolution: `720p`
- Supported resolutions: `720p`, `1080p`, `4k`
- `1080p` and `4k` must use `8 seconds`
- Supported aspect ratios: `16:9`, `9:16`

---

## Install

### Ask Your Agent to Install It

```text
Install ModelMax Skills: https://github.com/modelmaxio/skills
```

After installation, the agent will guide you through activation.

### Manual Install

```bash
git clone https://github.com/modelmaxio/skills.git
cd skills
cd skills/media-generation/scripts
npm install
npx mcporter --config "${OPENCLAW_HOME:-$HOME}/.openclaw/config/mcporter.json" config add modelmax-media "node $(pwd)/index.bundle.mjs"
```

---

## Activate

You need a ModelMax API key before using the skill.

### Recommended

Send your ModelMax API key directly to the agent.

### OpenClaw Config

```bash
/config set skills.entries.modelmax-media-generation.env.MODELMAX_API_KEY sk-xxxx
```

Or:

```bash
openclaw config set skills.entries.modelmax-media-generation.env.MODELMAX_API_KEY "sk-xxxx"
```

### Environment Variable

```bash
export MODELMAX_API_KEY="sk-xxxx"
```

---

## Auto Top-Up

Auto top-up requires:

- [agent-payment-skills](https://github.com/clinkbillcom/agent-payment-skills)

When enabled, the agent can recharge automatically and continue the original generation task.

Amount rules:

- If you explicitly provide a recharge amount in the current turn, that amount is used
- Otherwise, the system uses the merchant default amount

---

## Common Usage

### Image Generation

- `Generate a cyberpunk cat illustration`
- `Create a minimalist product poster`

### Video Generation

- `Create an 8-second 1080p sunset video`
- `Make a vertical 9:16 trailer from this image`

### Balance Check

- `Check my ModelMax balance`

### Auto Top-Up

- `Enable auto top-up`

---

## Update

```text
Update ModelMax Skills: https://github.com/modelmaxio/skills
```

## Uninstall

```text
Uninstall ModelMax Skills
```

---

## Compatibility

- OpenClaw

---

## License

MIT
