import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm/browser';
import { Company } from './company.entity';
import { Category } from './enum/category.enum';

@Entity()
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  publicationDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: false })
  thumbnailUrl: string;

  @Column({ nullable: false })
  summary: string;

  @Column({ nullable: true })
  aiSummary: string;

  @Column({ nullable: false })
  link: string;

  @Column({ type: 'jsonb', default: [] })
  similarLinks: string[];

  @Column({ type: 'enum', enum: Category, nullable: false })
  category: Category;

  // 뉴스 원문 언어
  @Column({ default: 'ko' })
  language: string;

  // 조회수 or 인기도 (트렌드 분석용)
  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Company, (company) => company.news)
  company: Company;
}
