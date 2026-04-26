import { Category } from 'src/news/entities/enum/category.enum';

export class UserDetailResponseDto {
  userId!: number;
  email!: string;
  username!: string;
  category!: Category;
  createdAt!: Date;
}
