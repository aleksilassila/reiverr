import { Test, TestingModule } from '@nestjs/testing';
import { CsnController } from './csn.controller';

describe('CsnController', () => {
  let controller: CsnController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CsnController],
    }).compile();

    controller = module.get<CsnController>(CsnController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
