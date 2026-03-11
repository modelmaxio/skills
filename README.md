<h1 align="center">ModelMax Skills</h1>

<p align="center">
  <strong>给你的 AI Agent 一键装上图片和视频生成能力</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://modelmax.io"><img src="https://img.shields.io/badge/ModelMax-API-orange.svg?style=for-the-badge" alt="ModelMax API"></a>
</p>

<p align="center">
  <a href="#快速上手">快速开始</a> · <a href="#支持的能力">支持的能力</a> · <a href="#配置">配置</a> · <a href="#自动充值">自动充值</a>
</p>

---

## 为什么需要 ModelMax Skills？

AI Agent 能帮你写代码、改文档——但你让它帮你生成张图片或视频，它就做不到了：

- 🖼️ "帮我生成一张赛博朋克风格的猫" → **生成不了**，没有接入图片生成模型
- 🎬 "帮我做一个 8 秒的产品宣传视频" → **做不了**，没有视频生成能力
- 💰 "余额不够了" → **卡住了**，不知道怎么充值

**ModelMax Skills 把这些变成一句话的事。**

---

## 快速上手

复制下面这句话给你的 AI Agent（OpenClaw、Claude Code、Cursor 等）：

```
帮我安装 ModelMax Skills：https://github.com/modelmaxio/modelmax-skills
```

就这一步。Agent 会自动 clone 仓库、配置 skill、并引导你完成 API Key 设置。

> 💡 **原理：** Agent 会读取仓库中的 SKILL.md，自动完成安装和注册。你不需要手动操作。

### 其他安装方式

<details>
<summary>通过 ClawHub CLI 安装</summary>

```bash
clawhub install modelmax-skills
```

Agent 会自动提示你配置 API Key。
</details>

<details>
<summary>手动安装</summary>

1. Clone 本仓库
2. 将 `modelmax-skills` 目录放到你的 Agent workspace 的 `skills` 目录下（如 `~/.openclaw/workspace/skills/`）
</details>

装好之后，直接用自然语言告诉 Agent：

- *"帮我生成一张赛博朋克风格的猫在霓虹灯下看书"*
- *"做一个 8 秒 1080p 的日落延时摄影视频"*
- *"用这张图片作为起始帧，生成一个 16:9 的视频"*
- *"查一下我的 ModelMax 余额"*

**不需要记 API 参数。** Agent 读了 SKILL.md 后自动知道该调什么工具、传什么参数。

---

## 支持的能力

| 能力 | 模型 | 说明 |
|------|------|------|
| 🖼️ **图片生成** | Gemini 3.1 Flash Image Preview | 文生图，默认 1024x1024 |
| 🎬 **视频生成** | Google Veo 3.1 | 文生视频，支持 720p / 1080p / 4K |
| 🎬 **图生视频** | Google Veo 3.1 | 提供起始帧/结束帧图片引导生成 |
| 🔊 **视频配音** | Google Veo 3.1 | 可选音频生成 |
| 💰 **余额查询** | — | 实时查看 ModelMax 账户余额 |
| 🔄 **自动充值** | — | 余额不足时自动通过 Clink 充值（需配置） |

### 视频参数一览

| 参数 | 可选值 | 默认值 | 备注 |
|------|--------|--------|------|
| 分辨率 | 720p, 1080p, 4K | 720p | 1080p 和 4K 必须 8 秒 |
| 画面比例 | 16:9, 9:16 | 16:9 | |
| 时长 | 5-8 秒 | 8 秒 | 高分辨率锁定 8 秒 |
| 音频 | true / false | false | |

---

## 配置

本 Skill 需要一个 **ModelMax API Key** 才能工作。

### 获取 API Key

前往 [ModelMax](https://modelmax.io) 注册账号并获取 API Key。

### 配置方式

#### 消息通道（飞书、Telegram、Discord 等）

安装过程中 Agent 会引导你输入 API Key。你也可以随时在聊天中发送：

```
/config set skills.entries.modelmax-skills.apiKey sk-your-modelmax-api-key
```

> ⚠️ 需要该 channel 已开启 `configWrites` 权限。如未开启，先让管理员设置 `channels.<channel>.configWrites=true`。

#### CLI 环境（Claude Code、Cursor 等）

```bash
openclaw config set skills.entries.modelmax-skills.apiKey "sk-your-modelmax-api-key"
```

#### 直接编辑配置文件

编辑 `~/.openclaw/openclaw.json`：
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

#### 环境变量

```bash
export MODELMAX_API_KEY="sk-your-modelmax-api-key"
```

---

## 更新

当 ModelMax Skills 有新版本时，告诉 Agent：

```
帮我更新 ModelMax Skills：https://github.com/modelmaxio/modelmax-skills
```

Agent 会自动拉取最新代码并完成更新。

如果使用了 ClawHub：

```bash
clawhub update modelmax-skills
```

---

## 自动充值

ModelMax Skills 集成了 [agent-payment-skills](https://clawhub.com/skills/agent-payment-skills)。开启后，余额不足时 Agent 会自动完成充值，不打断你的工作流：

1. 生成图片/视频时遇到余额不足（HTTP 402）
2. Agent 自动获取 merchant ID
3. 调用 Clink 支付完成充值
4. 充值成功后自动重试生成

**首次使用时**，Agent 会问你是否开启自动充值。如果开启，需要安装 `agent-payment-skills` 并配置 Clink 支付方式。

---

## 项目结构

```
modelmax-skills/
├── README.md
└── skills/
    └── media-generation/         # 图片 & 视频生成
        ├── SKILL.md              # Skill 定义（给 Agent 读的）
        └── scripts/
            └── index.mjs         # Tool 实现
```

与单 Skill 包（如 `agent-payment-skills`）不同，本仓库采用多 Skill 结构。未来可在 `skills/` 下扩展更多能力。

---

## 依赖

- [agent-payment-skills](https://clawhub.com/skills/agent-payment-skills) — 自动充值功能所需

## 兼容性

| Agent 平台 | 支持 |
|------------|------|
| OpenClaw | ✅ |
| Claude Code | ✅ |
| Cursor | ✅ |
| Windsurf | ✅ |

## License

MIT
