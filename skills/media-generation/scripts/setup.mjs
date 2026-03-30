import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

function resolveOpenClawHome() {
  const explicitHome = typeof process.env.OPENCLAW_HOME === "string" ? process.env.OPENCLAW_HOME.trim() : "";
  if (explicitHome && explicitHome !== "undefined") {
    return explicitHome;
  }
  return os.homedir();
}

const OPENCLAW_HOME = resolveOpenClawHome();
const MCPORTER_CONFIG_PATH = path.join(OPENCLAW_HOME, ".openclaw", "config", "mcporter.json");

// 检查是否已经存在环境变量
if (process.env.MODELMAX_API_KEY) {
  console.log("✅ 检测到 MODELMAX_API_KEY，跳过初始化。");
  process.exit(0);
}

// 如果都没找到，暂停并向用户索要
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("\n⚠️ [ModelMax MCP 插件初始化]");
console.log("运行此插件需要 MODELMAX_API_KEY，但未在环境中检测到。");

rl.question("请在此输入您的 API Key (输入回车跳过): ", (answer) => {
  const key = answer.trim();
  if (key) {
    // 第一步：由于注册阶段已经写入固定的 mcporter 配置文件，这里直接更新同一份配置
    try {
      if (fs.existsSync(MCPORTER_CONFIG_PATH)) {
        let config = JSON.parse(fs.readFileSync(MCPORTER_CONFIG_PATH, 'utf8'));
        if (config.mcpServers && config.mcpServers['modelmax-media']) {
            // 保留原有的 env 如果有的话
            config.mcpServers['modelmax-media'].env = { 
                ...config.mcpServers['modelmax-media'].env,
                "MODELMAX_API_KEY": key 
            };
            fs.writeFileSync(MCPORTER_CONFIG_PATH, JSON.stringify(config, null, 2));
            console.log("\n🎉 API Key 已成功保存至 mcporter MCP 环境变量！");
        } else {
            console.log("\n❌ 在 mcporter.json 中未找到 modelmax-media 服务，请确保服务已注册。");
        }
      } else {
        console.log(`\n❌ 未找到 mcporter.json 文件 (路径: ${MCPORTER_CONFIG_PATH})，请先完成 MCP 注册。`);
      }
    } catch (e) {
      console.log("\n❌ 自动写入失败，请手动在 mcporter.json 中配置 env");
    }
  } else {
    console.log("\n⚠️ 已跳过配置。在使用此插件前，请务必手动设置 MODELMAX_API_KEY！");
  }
  rl.close();
});
