#!/usr/bin/env node
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  compileMessage,
  normalizeMessageRequest,
  renderMessageFeishuCard,
  renderMessageMarkdown,
  renderMessagePlainText,
  resolvePreferredLocale,
} from './notification-utils.js';

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const SKILL_DIR = path.resolve(SCRIPT_DIR, '..');
const FEISHU_CARD_SENDER = path.join(SCRIPT_DIR, 'send-feishu-card.mjs');
const FEISHU_MEDIA_SENDER = path.join(SCRIPT_DIR, 'send-feishu-media.mjs');
const OPENCLAW_HOME = (() => {
  const explicitHome = typeof process.env.OPENCLAW_HOME === 'string' ? process.env.OPENCLAW_HOME.trim() : '';
  if (explicitHome && explicitHome !== 'undefined') return explicitHome;
  return os.homedir();
})();
const LOG_PATH = path.join(SKILL_DIR, 'error.log');

const CHANNEL_CAPABILITIES = Object.freeze({
  feishu: { rich: true, textMode: 'plain' },
  telegram: { rich: false, textMode: 'markdown' },
});

function logScriptError(context, error) {
  const parts = [
    `[${new Date().toISOString()}] [${context}]`,
    error instanceof Error ? error.stack || error.message : String(error),
  ];
  if (error && typeof error === 'object') {
    if (typeof error.stdout === 'string' && error.stdout.trim()) parts.push(`stdout: ${error.stdout.trim()}`);
    if (typeof error.stderr === 'string' && error.stderr.trim()) parts.push(`stderr: ${error.stderr.trim()}`);
  }
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, `${parts.join('\n')}\n`, 'utf8');
  } catch {}
}

function parseArgs(argv) {
  let payloadJson = '';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--payload') continue;
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error('--payload requires a JSON value');
    }
    payloadJson = value;
    i += 1;
  }
  if (!payloadJson) {
    throw new Error('Missing --payload');
  }
  const payload = JSON.parse(payloadJson);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Payload must be a JSON object');
  }
  return payload;
}

function normalizeTarget(payload) {
  const channel = typeof payload.channel === 'string' && payload.channel.trim()
    ? payload.channel.trim().toLowerCase()
    : '';
  const targetType = typeof payload?.target?.type === 'string' && payload.target.type.trim()
    ? payload.target.type.trim()
    : '';
  const targetId = typeof payload?.target?.id === 'string' && payload.target.id.trim()
    ? payload.target.id.trim()
    : '';
  const targetLocale = typeof payload?.target?.locale === 'string' && payload.target.locale.trim()
    ? payload.target.locale.trim()
    : '';
  if (!channel) throw new Error('channel is required');
  if (!targetType) throw new Error('target.type is required');
  if (!targetId) throw new Error('target.id is required');
  return { channel, targetType, targetId, targetLocale };
}

function collectMediaUrls(payload) {
  const mediaUrls = Array.isArray(payload.mediaUrls)
    ? payload.mediaUrls.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim())
    : [];
  if (typeof payload.mediaUrl === 'string' && payload.mediaUrl.trim()) {
    mediaUrls.unshift(payload.mediaUrl.trim());
  }
  return mediaUrls;
}

function resolveCompiledMessage(payload) {
  if (!payload.message_key && !payload.messageKey) return null;
  const { targetLocale } = normalizeTarget(payload);
  const preferredLocale = resolvePreferredLocale(payload.locale, targetLocale, payload.user_locale, payload.language);
  const request = normalizeMessageRequest(payload, { preferredLocale });
  return {
    request,
    compiled: compileMessage(request, { preferredLocale }),
  };
}

function resolveText(compiled, channel) {
  if (!compiled) return '';
  const capability = CHANNEL_CAPABILITIES[channel] || { rich: false, textMode: 'markdown' };
  return capability.textMode === 'plain'
    ? renderMessagePlainText(compiled)
    : renderMessageMarkdown(compiled);
}

function sendFeishuCard(payload, compiled) {
  const { targetId, targetType } = normalizeTarget(payload);
  if (targetType !== 'chat_id' && targetType !== 'open_id') {
    throw new Error('Feishu target.type must be "chat_id" or "open_id"');
  }
  const targetFlag = targetType === 'open_id' ? '--open-id' : '--chat-id';
  execFileSync(
    process.execPath,
    [FEISHU_CARD_SENDER, '--json', JSON.stringify(renderMessageFeishuCard(compiled)), targetFlag, targetId],
    { encoding: 'utf8', stdio: 'pipe', timeout: 15000 },
  );
}

function sendFeishuMedia(payload, compiled) {
  const { targetId, targetType } = normalizeTarget(payload);
  if (targetType !== 'chat_id' && targetType !== 'open_id') {
    throw new Error('Feishu target.type must be "chat_id" or "open_id"');
  }
  const mediaUrls = collectMediaUrls(payload);
  if (mediaUrls.length === 0) {
    throw new Error('mediaUrl or mediaUrls is required for media delivery');
  }
  const targetFlag = targetType === 'open_id' ? '--open-id' : '--chat-id';
  const durationSeconds = Number(
    payload?.durationSeconds ?? payload?.duration_seconds ?? payload?.mediaOptions?.durationSeconds ?? 0,
  );
  for (const mediaUrl of mediaUrls) {
    const args = [FEISHU_MEDIA_SENDER, mediaUrl, targetFlag, targetId];
    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
      args.push('--duration-seconds', String(Math.round(durationSeconds)));
    }
    execFileSync(process.execPath, args, { encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
  }
  const text = resolveText(compiled, 'feishu');
  if (text) {
    sendViaOpenClawMessage({ ...payload, mediaUrl: undefined, mediaUrls: undefined }, compiled);
  }
}

function sendViaOpenClawMessage(payload, compiled) {
  const { channel, targetId, targetType } = normalizeTarget(payload);
  const mediaUrls = collectMediaUrls(payload);
  const text = resolveText(compiled, channel);
  if (!text && mediaUrls.length === 0) {
    throw new Error('No text or media content available for delivery');
  }
  const target = channel === 'feishu'
    ? targetType === 'chat_id'
      ? `group:${targetId}`
      : targetType === 'open_id'
        ? `dm:${targetId}`
        : targetId
    : targetId;

  if (mediaUrls.length === 0) {
    execFileSync(
      'openclaw',
      ['message', 'send', '--channel', channel, '--target', target, '--message', text],
      { encoding: 'utf8', stdio: 'pipe', timeout: 30000 },
    );
    return;
  }

  mediaUrls.forEach((mediaUrl, index) => {
    const args = ['message', 'send', '--channel', channel, '--target', target, '--media', mediaUrl];
    if (index === 0 && text) args.push('--message', text);
    execFileSync('openclaw', args, { encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
  });
}

async function main() {
  const payload = parseArgs(process.argv.slice(2));
  const { channel } = normalizeTarget(payload);
  const compiledResult = resolveCompiledMessage(payload);
  const request = compiledResult?.request || null;
  const compiled = compiledResult?.compiled || null;
  const hasMedia = collectMediaUrls(payload).length > 0;
  const deliveryPolicy = request?.delivery_policy || { prefer_rich: true, allow_fallback: true };
  const capability = CHANNEL_CAPABILITIES[channel] || { rich: false, textMode: 'markdown' };

  if (hasMedia && channel === 'feishu') {
    sendFeishuMedia(payload, compiled);
    return;
  }
  if (hasMedia) {
    sendViaOpenClawMessage(payload, compiled);
    return;
  }
  if (channel === 'feishu' && compiled && capability.rich && deliveryPolicy.prefer_rich) {
    try {
      sendFeishuCard(payload, compiled);
      return;
    } catch (error) {
      logScriptError('scripts/send-message/feishu-rich', error);
      if (!deliveryPolicy.allow_fallback) {
        throw error;
      }
    }
  }
  sendViaOpenClawMessage(payload, compiled);
}

main().catch((error) => {
  logScriptError('scripts/send-message', error);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

