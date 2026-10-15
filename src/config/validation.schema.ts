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
});

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
