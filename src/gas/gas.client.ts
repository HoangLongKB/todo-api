import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface ExportTodoItem {
  id: string;
  title: string;
  done: boolean;
}

export interface ExportPayload {
  ownerUid: string;
  items: ExportTodoItem[];
}

export interface GasExportResult {
  ok: boolean;
  written?: number;
  sheetUrl?: string;
  error?: string;
}

const TIMEOUT_MS = 30_000;

/**
 * Chiều API -> GAS. Apps Script deploy thành Web app nhận POST ở hàm doPost(e).
 * Hai điểm riêng của GAS:
 *  - doPost KHÔNG đọc được header, nên secret phải nằm trong body JSON (đi trong HTTPS nên vẫn kín).
 *  - URL /exec trả 302 sang script.googleusercontent.com mới có nội dung; fetch tự theo redirect.
 */
@Injectable()
export class GasClient {
  private readonly logger = new Logger(GasClient.name);

  get configured(): boolean {
    return !!process.env.GAS_WEBAPP_URL && !!process.env.GAS_WEBAPP_SECRET;
  }

  async exportTodos(payload: ExportPayload): Promise<GasExportResult> {
    const url = process.env.GAS_WEBAPP_URL;
    const secret = process.env.GAS_WEBAPP_SECRET;
    if (!url || !secret) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình GAS_WEBAPP_URL / GAS_WEBAPP_SECRET',
      );
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'exportTodos', secret, ...payload }),
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Gọi GAS thất bại: ${msg}`);
      throw new BadGatewayException(`Không gọi được GAS: ${msg}`);
    }

    const text = await res.text();
    if (!res.ok) {
      this.logger.warn(`GAS trả ${res.status}: ${text.slice(0, 200)}`);
      throw new BadGatewayException(`GAS trả HTTP ${res.status}`);
    }

    let data: GasExportResult;
    try {
      data = JSON.parse(text) as GasExportResult;
    } catch {
      // GAS lỗi script thường trả trang HTML thay vì JSON
      throw new BadGatewayException('GAS không trả JSON (xem Executions log)');
    }
    if (!data.ok) {
      throw new BadGatewayException(`GAS báo lỗi: ${data.error ?? '?'}`);
    }
    return data;
  }
}
