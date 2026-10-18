import { z } from 'zod';

/**
 * Khung kiểm tra biến môi trường. App chỉ khởi động khi mọi biến hợp lệ.
 * Thiếu hoặc sai là ném lỗi ngay, không để lỗi lộ ra lúc đang chạy.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  DATABASE_URL: z.url().startsWith('postgres'),
  DB_MAX_CONNECTIONS: z.coerce.number().int().positive().default(10),
  // Không bắt buộc: thiếu thì app chạy không cache (fail-open)
  REDIS_URL: z.url().startsWith('redis').optional(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  // Chuỗi bí mật cho máy gọi máy (GAS, Scheduler). Tối thiểu 16 ký tự.
  WEBHOOK_SECRET: z.string().min(16),
  // Origin web được gọi API, cách nhau bằng dấu phẩy
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  // Chiều API -> GAS: URL web app Apps Script và secret riêng (không dùng chung WEBHOOK_SECRET).
  // Không bắt buộc: thiếu thì route export trả 503 "chưa cấu hình". Chuỗi rỗng coi như thiếu.
  GAS_WEBAPP_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  GAS_WEBAPP_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(16).optional(),
  ),
});

function emptyToUndefined(v: unknown): unknown {
  return typeof v === 'string' && v.trim() === '' ? undefined : v;
}

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Biến môi trường không hợp lệ:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
