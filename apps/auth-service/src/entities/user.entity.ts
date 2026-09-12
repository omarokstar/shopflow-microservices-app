import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '@app/common';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // Never store the plaintext password -- only the bcrypt hash.
  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;
}
