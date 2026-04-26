import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
// import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserRepository {
  private userRepository: Repository<User>;

  constructor(private readonly datasource: DataSource) {
    this.userRepository = this.datasource.getRepository(User);
  }
}
