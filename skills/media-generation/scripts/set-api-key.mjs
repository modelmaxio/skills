#!/usr/bin/env node
import { extractConfiguredApiKey, loadSkillRuntimeConfig, saveSkillRuntimeConfig, SKILL_RUNTIME_CONFIG_PATH } from "./runtime-config.mjs";

const args = process.argv.slice(2);
const apiKey = String(args[0] || "").trim();

if (!apiKey) {
  console.error("Usage: node scripts/set-api-key.mjs <MODELMAX_API_KEY>");
  process.exit(1);
}

if (!apiKey.startsWith("sk-")) {
  console.error("Error: ModelMax API key must start with 'sk-'.");
  process.exit(1);
}

const currentConfig = await loadSkillRuntimeConfig();
const previousApiKey = extractConfiguredApiKey(currentConfig);

await saveSkillRuntimeConfig({
  ...currentConfig,
  MODELMAX_API_KEY: apiKey,
});

if (previousApiKey === apiKey) {
  console.log(`MODELMAX_API_KEY already saved in ${SKILL_RUNTIME_CONFIG_PATH}`);
} else {
  console.log(`Saved MODELMAX_API_KEY to ${SKILL_RUNTIME_CONFIG_PATH}`);
}
