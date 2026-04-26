import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Category } from './enum/category.enum';

@Entity()
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true, name: 'publication_date' })
  publicationDate: Date;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'thumbnail_url',
  })
  thumbnailUrl: string;

  @Column({ nullable: false })
  summary: string;

  @Column({ nullable: true, name: 'ai_summary' })
  aiSummary: string;

  @Column({ nullable: false })
  link: string;

  @Column({ type: 'jsonb', default: [], name: 'similar_links' })
  similarLinks: string[];

  @Column({ type: 'enum', enum: Category, nullable: false })
  category: Category;

  // 뉴스 원문 언어
  @Column({ default: 'ko' })
  language: string;

  // 조회수 or 인기도 (트렌드 분석용)
  @Column({ default: 0, name: 'view_count' })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Company, (company) => company.news, { nullable: true })
  company: Company | null;
}
