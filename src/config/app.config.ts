import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Đọc version từ package.json một lần lúc khởi động. */
function readVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export const APP_VERSION = readVersion();
export const API_PREFIX = 'api/v1';
export const DOCS_PATH = 'api/docs';
