import { Module } from '@nestjs/common';
import { CsnController } from './csn.controller';
import { CsnService } from './csn.service';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { csnProviders } from './csn.providers';

@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [CsnController],
  providers: [...csnProviders, CsnService],
})
export class CsnModule {}
