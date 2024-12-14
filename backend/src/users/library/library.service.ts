import { Inject, Injectable } from '@nestjs/common';
import { USER_LIBRARY_REPOSITORY } from '../user.providers';
import { Repository } from 'typeorm';
import { LibraryItem } from './library.entity';
import { PaginationParamsDto } from 'src/common/common.dto';

@Injectable()
export class LibraryService {
  constructor(
    @Inject(USER_LIBRARY_REPOSITORY)
    private readonly libraryRepository: Repository<LibraryItem>,
  ) {}

  async getLibraryItems(
    userId: string,
    pagination: PaginationParamsDto,
  ): Promise<LibraryItem[]> {
    return this.libraryRepository.find({
      where: { userId },
      relations: {
        playStates: true,
      },
      take: pagination.itemsPerPage,
      skip: pagination.itemsPerPage * (pagination.page - 1),
    });
  }

  async findByTmdbId(
    userId: string,
    tmdbId: string,
  ): Promise<LibraryItem | null> {
    return this.libraryRepository.findOne({ where: { userId, tmdbId } });
  }

  async findOrCreateByTmdbId(
    userId: string,
    tmdbId: string,
  ): Promise<LibraryItem> {
    let libraryItem = await this.findByTmdbId(userId, tmdbId);

    if (!libraryItem) {
      libraryItem = this.libraryRepository.create({ userId, tmdbId });
      await this.libraryRepository.save(libraryItem);
    }

    return libraryItem;
  }

  async deleteByTmdbId(userId: string, tmdbId: string) {
    return await this.libraryRepository.delete({ userId, tmdbId });
  }
}
