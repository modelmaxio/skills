# ModelMax Skills

[English](README.md) | 简体中文

ModelMax Skills 可以为 OpenClaw Agent 增加图片生成、视频生成、余额查询和可选的自动充值能力。

---

## 能做什么

安装后，你可以直接让 Agent：

- 根据文本提示生成图片
- 根据文本提示或输入图片生成视频
- 查询当前 ModelMax 余额
- 在余额不足时自动充值并恢复任务

示例：

- `帮我生成一张赛博朋克风格的猫`
- `生成一个 8 秒 1080p 的日落视频`
- `用这张图做首帧，生成一个 16:9 视频`
- `看看我的 ModelMax 余额`

---

## 视频限制

- 默认分辨率：`720p`
- 支持分辨率：`720p`、`1080p`、`4k`
- `1080p` 和 `4k` 必须使用 `8 秒`
- 支持画幅：`16:9`、`9:16`

---

## 安装

### 让 Agent 自动安装

```text
帮我安装 ModelMax Skills：https://github.com/modelmaxio/skills
```

安装完成后，Agent 会继续引导你完成激活。

### 手动安装

```bash
git clone https://github.com/modelmaxio/skills.git
cd skills
cd skills/media-generation/scripts
npm install
npx mcporter --config "${OPENCLAW_HOME:-$HOME}/.openclaw/config/mcporter.json" config add modelmax-media "node $(pwd)/index.bundle.mjs"
```

---

## 激活

使用前需要先准备好 ModelMax API Key。

### 推荐方式

直接把 ModelMax API Key 发给 Agent。

### OpenClaw 配置

```bash
/config set skills.entries.modelmax-media-generation.env.MODELMAX_API_KEY sk-xxxx
```

或者：

```bash
openclaw config set skills.entries.modelmax-media-generation.env.MODELMAX_API_KEY "sk-xxxx"
```

### 环境变量

```bash
export MODELMAX_API_KEY="sk-xxxx"
```

---

## 自动充值

自动充值依赖：

- [agent-payment-skills](https://github.com/clinkbillcom/agent-payment-skills)

开启后，当余额不足时，Agent 可以自动完成充值并继续原来的生成任务。

金额规则：

- 如果你在当前这次明确指定了充值金额，优先使用你的金额
- 如果你没有指定金额，则使用商户默认金额

---

## 常见用法

### 图片生成

- `帮我生成一张赛博朋克风格的猫`
- `生成一张极简风格的产品海报`

### 视频生成

- `生成一个 8 秒 1080p 的日落视频`
- `用这张图生成一个竖版 9:16 视频`

### 余额查询

- `看看我的 ModelMax 余额`

### 自动充值

- `开启自动充值`

---

## 更新

```text
帮我更新 ModelMax Skills：https://github.com/modelmaxio/skills
```

## 卸载

```text
帮我卸载 ModelMax Skills
```

---

## 兼容环境

- OpenClaw

---

## License

MIT
