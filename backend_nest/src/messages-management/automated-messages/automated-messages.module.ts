import { Module } from '@nestjs/common';
import { AutomatedMessagesService } from './automated-messages.service';
import { AutomatedMessagesController } from './automated-messages.controller';

@Module({
  controllers: [AutomatedMessagesController],
  providers: [AutomatedMessagesService],
})
export class AutomatedMessagesModule {}
