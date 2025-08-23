import { Controller, Post, Get, Param, Body, Patch, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { JobApplicationService } from './jobapplication.service';
import { CreateJobApplicationDto } from './dto/create-jobapplication.dto';

@Controller('job-applications')
export class JobApplicationController {
  constructor(private readonly jobApplicationService: JobApplicationService) {}

  @Post('create')
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateJobApplicationDto) {
    return this.jobApplicationService.create(dto);
  }

  @Get('getAll')
  findAll() {
    return this.jobApplicationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobApplicationService.findOne(id);
  }

  @Patch(':id/review')
  markAsReviewed(@Param('id') id: string) {
    return this.jobApplicationService.markAsReviewed(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobApplicationService.delete(id);
  }
}