import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(SCRIPT_DIR, "..");

export const SKILL_RUNTIME_CONFIG_PATH = path.join(SKILL_DIR, "modelmax.config.json");

export async function loadSkillRuntimeConfig() {
  try {
    const raw = await fs.promises.readFile(SKILL_RUNTIME_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function saveSkillRuntimeConfig(config) {
  await fs.promises.mkdir(path.dirname(SKILL_RUNTIME_CONFIG_PATH), { recursive: true });
  await fs.promises.writeFile(SKILL_RUNTIME_CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

export function extractConfiguredApiKey(config) {
  const value = config?.MODELMAX_API_KEY;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function extractConfiguredAutoPayEnabled(config) {
  const value = config?.MODELMAX_AUTO_PAY;
  return value === true || value === "true";
}
