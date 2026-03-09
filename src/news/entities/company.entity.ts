import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm/browser';
import { News } from './news.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  name: string;

  @Column({ nullable: false })
  homepageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => News, (news) => news.company)
  news: News[];
}
