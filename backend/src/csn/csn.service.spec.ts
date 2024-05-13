import { Test, TestingModule } from '@nestjs/testing';
import { CsnService } from './csn.service';

describe('CsnService', () => {
  let service: CsnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsnService],
    }).compile();

    service = module.get<CsnService>(CsnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
