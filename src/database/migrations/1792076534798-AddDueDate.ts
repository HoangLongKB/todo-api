import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDueDate1792076534798 implements MigrationInterface {
  name = 'AddDueDate1792076534798';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "todo" ADD "due_date" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "todo" DROP COLUMN "due_date"`);
  }
}
