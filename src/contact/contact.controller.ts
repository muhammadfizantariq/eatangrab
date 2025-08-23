import { Controller, Post, Get, Param, Body, Patch, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('create')
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Get('getAll')
  findAll() {
    return this.contactService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactService.delete(id);
  }
}