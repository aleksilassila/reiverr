import { Inject, Injectable } from '@nestjs/common';
import { MY_LIST_REPOSITORY } from './my-list.providers';
import { Repository } from 'typeorm';
import { MyListItem } from './my-list-item.entity';
import { User } from '../user.entity';

@Injectable()
export class MyListService {
  constructor(
    @Inject(MY_LIST_REPOSITORY)
    private readonly myListRepository: Repository<MyListItem>,
  ) {}

  getMyList(user: User) {
    return this.myListRepository.find({ where: { user: { id: user.id } } });
  }

  async addToMyList(user: User, tmdbId: number) {
    const myListItem = this.myListRepository.create({
      tmdbId,
      user,
    });

    await this.myListRepository.save(myListItem);

    return this.getMyList(user);
  }

  async removeFromMyList(user: User, tmdbId: number) {
    await this.myListRepository.delete({ user: { id: user.id }, tmdbId });

    return this.getMyList(user);
  }
}
