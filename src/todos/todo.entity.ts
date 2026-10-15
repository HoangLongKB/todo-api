import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Một dòng trong bảng "todo". Tên bảng đặt rõ để không phụ thuộc tên class. */
@Entity({ name: 'todo' })
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'boolean', default: false })
  done!: boolean;

  /** Hạn làm. nullable vì todo không bắt buộc có hạn. */
  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  /** uid người sở hữu, lấy từ Firebase token. Có index vì mọi truy vấn lọc theo cột này. */
  @Index()
  @Column({ name: 'owner_uid', type: 'varchar', length: 128 })
  ownerUid!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
