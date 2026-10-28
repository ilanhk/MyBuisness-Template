import { Injectable } from '@nestjs/common';
import { CreateAutomatedMessageDto } from './dto/create-automated-message.dto';
import { UpdateAutomatedMessageDto } from './dto/update-automated-message.dto';

@Injectable()
export class AutomatedMessagesService {
  create(createAutomatedMessageDto: CreateAutomatedMessageDto) {
    return 'This action adds a new automatedMessage';
  }

  findAll() {
    return `This action returns all automatedMessages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} automatedMessage`;
  }

  update(id: number, updateAutomatedMessageDto: UpdateAutomatedMessageDto) {
    return `This action updates a #${id} automatedMessage`;
  }

  remove(id: number) {
    return `This action removes a #${id} automatedMessage`;
  }
}
