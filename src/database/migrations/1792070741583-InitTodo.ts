import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTodo1792070741583 implements MigrationInterface {
  name = 'InitTodo1792070741583';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "todo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "done" boolean NOT NULL DEFAULT false, "owner_uid" character varying(128) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d429b7114371f6a35c5cb4776a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3334422434dfbc6d488935a6b7" ON "todo" ("owner_uid") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3334422434dfbc6d488935a6b7"`,
    );
    await queryRunner.query(`DROP TABLE "todo"`);
  }
}
