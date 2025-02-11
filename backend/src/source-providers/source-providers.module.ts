import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SourceProvidersController } from './source-providers.controller';
import { SourceProvidersService } from './source-providers.service';

@Module({
  providers: [SourceProvidersService],
  controllers: [SourceProvidersController],
  exports: [SourceProvidersService],
  imports: [forwardRef(() => UsersModule)],
})
export class SourceProvidersModule {}
