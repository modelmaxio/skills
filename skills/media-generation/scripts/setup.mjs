import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";

// 检查是否已经存在环境变量
if (process.env.MODELMAX_API_KEY) {
  console.log("✅ 检测到 MODELMAX_API_KEY，跳过初始化。");
  process.exit(0);
}

// 检查 OpenClaw 的 config 是否存了这个变量
try {
  const envVal = execSync('openclaw config env get MODELMAX_API_KEY', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (envVal && envVal !== "undefined" && envVal !== "null") {
    console.log("✅ 从 OpenClaw 配置中读取到 MODELMAX_API_KEY，跳过初始化。");
    process.exit(0);
  }
} catch (e) {
  // openclaw CLI 可能没装，忽略错误
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
    // 将用户输入的 Key 写入到系统的 openclaw 配置中
    try {
      execSync(`openclaw config set skills.entries.modelmax-media-generation.env.MODELMAX_API_KEY="${key}"`, { stdio: 'inherit' });
      console.log("\n🎉 API Key 已成功保存至 OpenClaw 环境变量！");
    } catch (e) {
      console.log("\n❌ 自动写入失败，请手动执行: openclaw config set skills.entries.modelmax-media-generation.env.MODELMAX_API_KEY=\"你的Key\"");
    }
  } else {
    console.log("\n⚠️ 已跳过配置。在使用此插件前，请务必手动设置 MODELMAX_API_KEY！");
  }
  rl.close();
});
