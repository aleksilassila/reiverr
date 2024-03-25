import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findOneByName(name: string): Promise<User> {
    return this.userRepository.findOne({ where: { name } });
  }

  async create(name: string, password: string, isAdmin = false): Promise<User> {
    const user = this.userRepository.create();
    user.name = name;
    // TODO: Hash password
    user.password = password;
    user.isAdmin = isAdmin;
    return this.userRepository.save(user);
  }

  async update(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async noPreviousAdmins(): Promise<boolean> {
    const adminCount = await this.userRepository.count({
      where: { isAdmin: true },
    });

    return adminCount === 0;
  }
}
