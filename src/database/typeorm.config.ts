import 'dotenv/config';
import { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Một cấu hình TypeORM dùng cho CẢ HAI: app lúc chạy và CLI lúc tạo/chạy migration.
 * Nếu tách hai nơi, sớm muộn chúng lệch nhau và migration sinh ra sai.
 *
 * synchronize: false là bắt buộc. Bật lên TypeORM sẽ tự sửa bảng cho khớp code,
 * có thể xóa cột đang có dữ liệu ở môi trường thật. Mọi thay đổi DB đi qua migration.
 */
export function buildDataSourceOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Thiếu DATABASE_URL');
  return {
    type: 'postgres',
    url,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging:
      process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    extra: {
      // connection pool: số kết nối tối đa app giữ với Postgres
      max: Number(process.env.DB_MAX_CONNECTIONS ?? 10),
    },
  };
}

/** CLI của TypeORM đọc default export này. */
export default new DataSource(buildDataSourceOptions());
