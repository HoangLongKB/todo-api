import { MigrationInterface, QueryRunner } from 'typeorm';

export class BadDemo1792689271550 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "todo" ADD COLUMN
  "priority" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABEL "todo" ADD COLUMN "note"
  text`); // cố tình sai: TABEL
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "todo" DROP COLUMN
  "note"`);
    await queryRunner.query(`ALTER TABLE "todo" DROP COLUMN

  "priority"`);
  }
}
