#!/usr/bin/env node
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const FEISHU_CARD_SENDER = path.join(SCRIPT_DIR, 'send-feishu-card.mjs');
const FEISHU_MEDIA_SENDER = path.join(SCRIPT_DIR, 'send-feishu-media.mjs');
const OPENCLAW_HOME = (() => {
  const explicitHome = typeof process.env.OPENCLAW_HOME === 'string' ? process.env.OPENCLAW_HOME.trim() : '';
  if (explicitHome && explicitHome !== 'undefined') return explicitHome;
  return os.homedir();
})();
const LOG_PATH = path.join(OPENCLAW_HOME, '.openclaw', 'state', 'modelmax-media', 'error.log');

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
    i++;
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

function sanitizeInlineMarkup(text) {
  return String(text || '')
    .replace(/<font\b[^>]*>/gi, '')
    .replace(/<\/font>/gi, '')
    .replace(/<at\b[^>]*>(.*?)<\/at>/gi, '$1')
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .trim();
}

function getElementText(element) {
  if (!element || typeof element !== 'object') return '';
  if (typeof element.content === 'string') return sanitizeInlineMarkup(element.content);
  if (element.text && typeof element.text === 'object' && typeof element.text.content === 'string') {
    return sanitizeInlineMarkup(element.text.content);
  }
  return '';
}

function getActionUrl(action) {
  if (!action || typeof action !== 'object') return '';
  if (typeof action.url === 'string' && action.url.trim()) return action.url.trim();
  const multiUrl = action.multi_url;
  if (!multiUrl || typeof multiUrl !== 'object') return '';
  return (multiUrl.url || multiUrl.pc_url || multiUrl.android_url || multiUrl.ios_url || '').trim();
}

function renderElement(element) {
  if (!element || typeof element !== 'object') return '';
  if (element.tag === 'hr') return '---';
  if (element.tag === 'action' && Array.isArray(element.actions)) {
    return element.actions.map((action) => {
      const label = getElementText(action.text || action);
      const url = getActionUrl(action);
      if (url) return `- [${label || 'Open'}](${url})`;
      return label ? `- ${label}` : '';
    }).filter(Boolean).join('\n');
  }
  if (element.tag === 'button') {
    const label = getElementText(element.text || element);
    const url = getActionUrl(element);
    if (url) return `- [${label || 'Open'}](${url})`;
    return label ? `- ${label}` : '';
  }
  if (element.tag === 'note' && Array.isArray(element.elements)) {
    return element.elements.map(renderElement).filter(Boolean).join('\n');
  }
  if (element.tag === 'column_set' && Array.isArray(element.columns)) {
    return element.columns
      .map((column) => Array.isArray(column.elements) ? column.elements.map(renderElement).filter(Boolean).join('\n') : '')
      .filter(Boolean)
      .join('\n');
  }
  return getElementText(element);
}

function renderCardToMarkdown(card) {
  const sections = [];
  const title = sanitizeInlineMarkup(card?.header?.title?.content || '');
  if (title) sections.push(`**${title}**`);
  const elements = Array.isArray(card?.elements)
    ? card.elements
    : Array.isArray(card?.body?.elements)
      ? card.body.elements
      : [];
  for (const element of elements) {
    const rendered = renderElement(element);
    if (rendered) sections.push(rendered);
  }
  return sections.join('\n\n').trim();
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
  if (!channel) throw new Error('channel is required');
  if (!targetType) throw new Error('target.type is required');
  if (!targetId) throw new Error('target.id is required');
  return { channel, targetType, targetId };
}

function sendFeishuCard(payload) {
  const { targetId, targetType } = normalizeTarget(payload);
  if (targetType !== 'chat_id' && targetType !== 'open_id') {
    throw new Error('Feishu target.type must be "chat_id" or "open_id"');
  }
  const targetFlag = targetType === 'open_id' ? '--open-id' : '--chat-id';
  execFileSync(
    process.execPath,
    [FEISHU_CARD_SENDER, '--json', JSON.stringify(payload.card), targetFlag, targetId],
    { encoding: 'utf8', stdio: 'pipe', timeout: 15000 },
  );
}

function sendFeishuText(payload) {
  const text = typeof payload.text === 'string' && payload.text.trim()
    ? payload.text.trim()
    : renderCardToMarkdown(payload.card);
  if (!text) throw new Error('No text content available for Feishu delivery');
  sendViaOpenClawMessage({
    ...payload,
    card: undefined,
    text,
  });
}

function sendFeishuMedia(payload) {
  const { targetId, targetType } = normalizeTarget(payload);
  if (targetType !== 'chat_id' && targetType !== 'open_id') {
    throw new Error('Feishu target.type must be "chat_id" or "open_id"');
  }
  const mediaUrls = Array.isArray(payload.mediaUrls)
    ? payload.mediaUrls.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim())
    : [];
  if (typeof payload.mediaUrl === 'string' && payload.mediaUrl.trim()) {
    mediaUrls.unshift(payload.mediaUrl.trim());
  }
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
    execFileSync(
      process.execPath,
      args,
      { encoding: 'utf8', stdio: 'pipe', timeout: 30000 },
    );
  }
  if (typeof payload.text === 'string' && payload.text.trim()) {
    sendFeishuText({ ...payload, card: undefined, mediaUrl: undefined, mediaUrls: undefined });
  }
}

function sendViaOpenClawMessage(payload) {
  const { channel, targetId, targetType } = normalizeTarget(payload);
  const text = typeof payload.text === 'string' && payload.text.trim()
    ? payload.text.trim()
    : renderCardToMarkdown(payload.card);
  const mediaUrls = Array.isArray(payload.mediaUrls)
    ? payload.mediaUrls.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim())
    : [];
  if (typeof payload.mediaUrl === 'string' && payload.mediaUrl.trim()) {
    mediaUrls.unshift(payload.mediaUrl.trim());
  }
  if (!text && mediaUrls.length === 0) throw new Error('No text or media content available for delivery');
  const target = channel === 'feishu'
    ? targetType === 'chat_id'
      ? `group:${targetId}`
      : targetType === 'open_id'
        ? `user:${targetId}`
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
    if (index === 0 && text) {
      args.push('--message', text);
    }
    execFileSync('openclaw', args, { encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
  });
}

async function main() {
  const payload = parseArgs(process.argv.slice(2));
  const channel = typeof payload.channel === 'string' ? payload.channel.trim().toLowerCase() : '';
  const hasMedia =
    (typeof payload.mediaUrl === 'string' && payload.mediaUrl.trim()) ||
    (Array.isArray(payload.mediaUrls) && payload.mediaUrls.some((entry) => typeof entry === 'string' && entry.trim()));
  if (hasMedia && channel === 'feishu') {
    sendFeishuMedia(payload);
    return;
  }
  if (hasMedia) {
    sendViaOpenClawMessage(payload);
    return;
  }
  if ((payload.card || payload.text) && channel === 'feishu' && payload.card) {
    try {
      sendFeishuCard(payload);
    } catch (error) {
      logScriptError('scripts/send-message/feishu-card-fallback', error);
      sendFeishuText(payload);
    }
    return;
  }
  if (channel === 'feishu') {
    sendFeishuText(payload);
    return;
  }
  sendViaOpenClawMessage(payload);
}

main().catch((error) => {
  logScriptError('scripts/send-message', error);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
