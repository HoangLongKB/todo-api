import { Logger, Provider } from '@nestjs/common';
import * as admin from 'firebase-admin';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

/**
 * Khởi tạo firebase-admin KHÔNG dùng file key JSON.
 * applicationDefault() tự tìm danh tính theo thứ tự:
 *   1. biến GOOGLE_APPLICATION_CREDENTIALS (không dùng)
 *   2. token của `gcloud auth application-default login` trên máy dev
 *   3. service account gắn vào Cloud Run khi chạy trên cloud
 * Cùng một đoạn code chạy ở cả hai nơi, không có key để lộ.
 */
export const firebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  useFactory: (): admin.app.App => {
    const logger = new Logger('FirebaseAdmin');
    if (admin.apps.length > 0) return admin.app();
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
    logger.log(`firebase-admin sẵn sàng, project=${projectId ?? '(auto)'}`);
    return app;
  },
};
