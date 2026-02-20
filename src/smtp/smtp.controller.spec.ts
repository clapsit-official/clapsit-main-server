import { Test, TestingModule } from '@nestjs/testing';
import { SmtpController } from './smtp.controller';
import { SmtpService } from './smtp.service';

describe('SmtpController', () => {
  let controller: SmtpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmtpController],
      providers: [
        { provide: SmtpService, useValue: {} },
      ],
    }).compile();

    controller = module.get<SmtpController>(SmtpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
