import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobApplicationDocument = JobApplication & Document;

@Schema({ timestamps: true })
export class JobApplication {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: false })
  experience?: string;

  @Prop({ required: false, default: '' })
  resumeUrl?: string; // This will store the file path, not base64

  @Prop({ required: false })
  coverLetter?: string;

  @Prop({ required: false, default: false })
  isReviewed?: boolean;
}

export const JobApplicationSchema = SchemaFactory.createForClass(JobApplication);