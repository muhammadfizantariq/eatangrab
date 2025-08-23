import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobApplicationController } from './jobapplication.controller';
import { JobApplication, JobApplicationSchema } from './schema/jobapplication.schema';
import { JobApplicationService } from './jobapplication.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: JobApplication.name, schema: JobApplicationSchema }])
  ],
  controllers: [JobApplicationController],
  providers: [JobApplicationService],
  exports: [JobApplicationService],
})
export class JobApplicationModule {}
