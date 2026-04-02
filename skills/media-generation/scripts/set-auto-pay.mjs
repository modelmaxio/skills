#!/usr/bin/env node
import {
  extractConfiguredAutoPayEnabled,
  loadSkillRuntimeConfig,
  saveSkillRuntimeConfig,
  SKILL_RUNTIME_CONFIG_PATH,
} from "./runtime-config.mjs";

const args = process.argv.slice(2);
const rawValue = String(args[0] || "").trim().toLowerCase();

if (rawValue !== "true" && rawValue !== "false") {
  console.error("Usage: node scripts/set-auto-pay.mjs <true|false>");
  process.exit(1);
}

const enabled = rawValue === "true";
const currentConfig = await loadSkillRuntimeConfig();
const previousEnabled = extractConfiguredAutoPayEnabled(currentConfig);

await saveSkillRuntimeConfig({
  ...currentConfig,
  MODELMAX_AUTO_PAY: enabled,
});

if (previousEnabled === enabled) {
  console.log(`MODELMAX_AUTO_PAY already set to ${enabled} in ${SKILL_RUNTIME_CONFIG_PATH}`);
} else {
  console.log(`Saved MODELMAX_AUTO_PAY=${enabled} to ${SKILL_RUNTIME_CONFIG_PATH}`);
}
