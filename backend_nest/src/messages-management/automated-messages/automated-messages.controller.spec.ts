import { Test, TestingModule } from '@nestjs/testing';
import { AutomatedMessagesController } from './automated-messages.controller';
import { AutomatedMessagesService } from './automated-messages.service';

describe('AutomatedMessagesController', () => {
  let controller: AutomatedMessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutomatedMessagesController],
      providers: [AutomatedMessagesService],
    }).compile();

    controller = module.get<AutomatedMessagesController>(AutomatedMessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
