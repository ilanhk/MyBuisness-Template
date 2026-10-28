import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AutomatedMessagesService } from './automated-messages.service';
import { CreateAutomatedMessageDto } from './dto/create-automated-message.dto';
import { UpdateAutomatedMessageDto } from './dto/update-automated-message.dto';

@Controller('automated-messages')
export class AutomatedMessagesController {
  constructor(private readonly automatedMessagesService: AutomatedMessagesService) {}

  @Post()
  create(@Body() createAutomatedMessageDto: CreateAutomatedMessageDto) {
    return this.automatedMessagesService.create(createAutomatedMessageDto);
  }

  @Get()
  findAll() {
    return this.automatedMessagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.automatedMessagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAutomatedMessageDto: UpdateAutomatedMessageDto) {
    return this.automatedMessagesService.update(+id, updateAutomatedMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.automatedMessagesService.remove(+id);
  }
}
