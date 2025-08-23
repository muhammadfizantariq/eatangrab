// ========================
// UPDATED JOB APPLICATION SERVICE WITH RESUME ATTACHMENT
// ========================

// src/jobapplication/jobapplication.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobApplication, JobApplicationDocument } from './schema/jobapplication.schema';
import { CreateJobApplicationDto } from './dto/create-jobapplication.dto';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JobApplicationService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(JobApplication.name) private jobApplicationModel: Model<JobApplicationDocument>,
    private configService: ConfigService,
  ) {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('USER_EMAIL'),
        pass: this.configService.get<string>('USER_PASSWORD'),
      },
    });
  }

  // Helper method to save base64 resume file
 private async saveBase64Resume(base64String: string, applicantName: string, position: string): Promise<string> {
  try {
    console.log('🔍 File Save Debug - Starting...');
    console.log('📄 Original base64 length:', base64String.length);
    
    // More robust base64 cleaning
    let cleanBase64 = base64String;
    
    // Remove various data URL prefixes
    const dataUrlPatterns = [
      /^data:application\/pdf;base64,/,
      /^data:application\/octet-stream;base64,/,
      /^data:[^;]*;base64,/,
      /^data:,/
    ];
    
    for (const pattern of dataUrlPatterns) {
      if (pattern.test(cleanBase64)) {
        cleanBase64 = cleanBase64.replace(pattern, '');
        console.log('🧹 Removed data URL prefix');
        break;
      }
    }
    
    console.log('📊 Clean base64 length:', cleanBase64.length);
    
    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      throw new Error('Invalid base64 format detected');
    }
    
    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory');
    }

    // Generate filename
    const timestamp = Date.now();
    const sanitizedName = applicantName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedPosition = position.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `resume_${sanitizedName}_${sanitizedPosition}_${timestamp}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    console.log('💾 Saving to:', filepath);

    // Convert base64 to buffer with validation
    let buffer: Buffer;
    try {
      buffer = Buffer.from(cleanBase64, 'base64');
      console.log('📦 Buffer created, size:', buffer.length, 'bytes');
      
      // Validate buffer content (PDF should start with %PDF)
      const bufferStart = buffer.slice(0, 4).toString();
      console.log('📋 File header:', bufferStart);
      
      if (!bufferStart.includes('%PDF')) {
        console.warn('⚠️ Warning: File may not be a valid PDF');
      }
      
    } catch (bufferError) {
      throw new Error(`Buffer conversion failed: ${bufferError.message}`);
    }

    // Write file with error handling
    try {
      fs.writeFileSync(filepath, buffer);
      console.log('✅ File written successfully');
      
      // Verify file was written correctly
      const savedFileSize = fs.statSync(filepath).size;
      console.log('📊 Saved file size:', savedFileSize, 'bytes');
      
      if (savedFileSize === 0) {
        throw new Error('File saved with 0 bytes');
      }
      
      if (savedFileSize !== buffer.length) {
        console.warn('⚠️ File size mismatch - Expected:', buffer.length, 'Got:', savedFileSize);
      }
      
    } catch (writeError) {
      throw new Error(`File write failed: ${writeError.message}`);
    }

    // Return relative path
    const relativePath = `uploads/resumes/${filename}`;
    console.log('🎯 Returning path:', relativePath);
    
    return relativePath;
    
  } catch (error) {
    console.error('❌ File save error:', error.message);
    throw new HttpException({
      status: 'error',
      message: `Failed to save resume file: ${error.message}`,
      data: null
    }, HttpStatus.BAD_REQUEST);
  }
}

  // Helper method to delete old resume
  private async deleteOldResume(resumePath: string): Promise<void> {
    try {
      if (resumePath && resumePath !== '') {
        const fullPath = path.join(process.cwd(), resumePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (error) {
      console.log('Error deleting old resume:', error.message);
    }
  }

  // Email template for job application confirmation (USER KO)
  private getJobApplicationThankYouTemplate(applicationData: any): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Job Application Received - Grab & Eat</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #333 0%, #E30613 50%, #FFD200 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .header p { color: rgba(255,255,255,0.95); font-size: 18px; }
        .content { padding: 40px 30px; }
        .welcome-msg { text-align: center; margin-bottom: 30px; }
        .welcome-msg h2 { color: #E30613; font-size: 26px; margin-bottom: 15px; }
        .welcome-msg p { color: #555; font-size: 16px; line-height: 1.6; }
        .application-summary { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 10px; border: 2px solid #FFD200; margin: 25px 0; }
        .position-card { background: #E30613; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 15px; }
        .position-card h3 { font-size: 20px; }
        .timeline { background: #333; color: white; padding: 25px; border-radius: 10px; margin: 25px 0; }
        .timeline h3 { color: #FFD200; margin-bottom: 20px; }
        .timeline-item { display: flex; align-items: center; margin-bottom: 15px; }
        .timeline-icon {  color: #FFD200; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
        .tips-section { background: #FFD200; color: #333; padding: 25px; border-radius: 10px; margin: 25px 0; }
        .tips-section h3 { margin-bottom: 15px; }
        .tips-section ul { list-style: none; }
        .tips-section li { margin-bottom: 8px; padding-left: 20px; position: relative; }
        .tips-section li:before { content: "💡"; position: absolute; left: 0; }
        .footer { background: #333; color: white; padding: 25px; text-align: center; }
        .resume-status { background: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍔 Grab & Eat</h1>
          <p>Building the Best Team in Belgium</p>
        </div>
        
        <div class="content">
          <div class="welcome-msg">
            <h2>Application Received Successfully! 🎉</h2>
            <p>Dear ${applicationData.firstName},</p>
            <p>Thank you for your interest in joining the Grab & Eat family! We're excited to review your application for the <strong>${applicationData.position}</strong> position.</p>
          </div>
          
          <div class="application-summary">
            <div class="position-card">
              <h3>🎯 ${applicationData.position}</h3>
            </div>
            <p><strong>📅 Application Date:</strong> ${new Date().toLocaleDateString('en-PK')}</p>
            <p><strong>📧 Email:</strong> ${applicationData.email}</p>
            <p><strong>📱 Phone:</strong> ${applicationData.phone}</p>
          </div>

          ${applicationData.hasResume ? `
          <div class="resume-status">
            <h3>📄 Resume Status: Successfully Uploaded! ✅</h3>
            <p>Your resume has been securely received and will be reviewed by our HR team.</p>
          </div>
          ` : `
          <div style="background: #ffc107; color: #333; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3>⚠️ Resume Note</h3>
            <p>No resume was uploaded with this application. You can email your resume to hr@grabandeat.be</p>
          </div>
          `}
          
          <div class="timeline">
            <h3>📋 Our Hiring Process</h3>
            <div class="timeline-item">
              <div class="timeline-icon">1</div>
              <div>Application Review (2-3 business days)</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon">2</div>
              <div>Initial Phone/Video Interview</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon">3</div>
              <div>In-Person Interview & Restaurant Visit</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon">4</div>
              <div>Final Decision & Offer</div>
            </div>
          </div>
          
          <div class="tips-section">
            <h3>💼 What to Expect Next</h3>
            <ul>
              <li>We'll review your application within 2-3 business days</li>
              <li>If selected, we'll contact you for an initial interview</li>
              <li>Keep your phone accessible - we might call!</li>
              <li>Feel free to visit our restaurant to see our team in action</li>
              <li>Check your email regularly for updates</li>
            </ul>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #E30613;">
            <h3 style="color: #E30613; margin-bottom: 10px;">📞 Questions?</h3>
            <p>Contact our HR team at <strong>hr@grabandeat.be</strong></p>
            <p>Or call us at <strong>+32 123 456 789</strong></p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Grab & Eat Management</strong></p>
          <p>We're excited about the possibility of working together!</p>
          <p style="margin-top: 10px; font-size: 14px; opacity: 0.8;">Fresh • Fast • Tasty • Great Team</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // HR notification email template (TUMHE)
  private getHRNotificationTemplate(applicationData: any): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Job Application - HR Notification</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #E30613 0%, #333 50%, #FFD200 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; font-size: 28px; font-weight: bold; margin-bottom: 5px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 30px; }
        .candidate-card { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 2px solid #FFD200; }
        .candidate-name { font-size: 24px; font-weight: bold; color: #E30613; margin-bottom: 5px; }
        .candidate-position { background: #E30613; color: white; padding: 6px 12px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: 500; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .info-item { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #FFD200; }
        .info-label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
        .info-value { color: #333; font-weight: 500; }
        .experience-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .experience-section h3 { color: #E30613; margin-bottom: 10px; }
        .cover-letter-section { background: linear-gradient(135deg, #E30613 0%, #c8050f 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .cover-letter-section h3 { margin-bottom: 15px; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; }
        .timestamp { background: #FFD200; color: #333; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: 500; }
        .priority { background: #dc3545; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .resume-attachment { background: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍔 Grab & Eat</h1>
          <p>New Job Application Received</p>
          <span class="priority">🔥 URGENT REVIEW</span>
        </div>
        
        <div class="content">
          <div class="timestamp">📅 ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</div>
          
          <div class="candidate-card">
            <div class="candidate-name">${applicationData.firstName} ${applicationData.lastName}</div>
            <div class="candidate-position">🎯 ${applicationData.position}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">📧 Email Address</div>
              <div class="info-value">${applicationData.email}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">📱 Phone Number</div>
              <div class="info-value">${applicationData.phone}</div>
            </div>
          </div>

          ${applicationData.hasResume ? `
          <div class="resume-attachment">
            <h3>📎 Resume Attached</h3>
            <p>Resume file has been attached to this email for your review.</p>
          </div>
          ` : `
          <div style="background: #ffc107; color: #333; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0;">
            <h3>⚠️ No Resume Attached</h3>
            <p>Candidate did not upload a resume with this application.</p>
          </div>
          `}
          
          ${applicationData.experience ? `
          <div class="experience-section">
            <h3>💼 Work Experience</h3>
            <p>${applicationData.experience}</p>
          </div>
          ` : ''}
          
          ${applicationData.coverLetter ? `
          <div class="cover-letter-section">
            <h3>💌 Cover Letter</h3>
            <p style="line-height: 1.6;">${applicationData.coverLetter}</p>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p><strong>Grab & Eat Management System</strong></p>
          <p>Please review this application within 48 hours</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Send thank you email to applicant (USER KO)
  private async sendThankYouEmail(applicationData: any): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('USER_EMAIL'),
      to: applicationData.email,
      subject: `🎯 Job Application Received - ${applicationData.position} Position`,
      html: this.getJobApplicationThankYouTemplate(applicationData),
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Send HR notification email with resume attachment (TUMHE)
  private async sendHRNotificationEmail(applicationData: any, resumePath?: string): Promise<void> {
    const mailOptions: any = {
      from: this.configService.get<string>('USER_EMAIL'),
      to: this.configService.get<string>('USER_EMAIL'), // HR email (tumhara email)
      subject: `🎯 New Job Application: ${applicationData.position} - ${applicationData.firstName} ${applicationData.lastName}`,
      html: this.getHRNotificationTemplate(applicationData),
    };

    // Add resume as attachment if exists
    if (resumePath && fs.existsSync(path.join(process.cwd(), resumePath))) {
      mailOptions.attachments = [
        {
          filename: `${applicationData.firstName}_${applicationData.lastName}_Resume.pdf`,
          path: path.join(process.cwd(), resumePath),
          contentType: 'application/pdf'
        }
      ];
    }

    await this.transporter.sendMail(mailOptions);
  }

  async create(dto: CreateJobApplicationDto) {
    try {
      let resumePath = '';
      let hasResume = false;

      // Handle base64 resume if provided
      if (dto.resumeBase64 && dto.resumeBase64.trim() !== '') {
        const applicantName = `${dto.firstName}_${dto.lastName}`;
        resumePath = await this.saveBase64Resume(dto.resumeBase64, applicantName, dto.position);
        hasResume = true;
      }

      // Create application data without base64
      const applicationData = {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        position: dto.position,
        experience: dto.experience,
        coverLetter: dto.coverLetter,
        resumeUrl: resumePath,
        isReviewed: false
      };

      const application = new this.jobApplicationModel(applicationData);
      const result = await application.save();
      
      // 📧 Send thank you email to user
      try {
        const userEmailData = { ...dto, hasResume };
        await this.sendThankYouEmail(userEmailData);
        console.log('✅ Thank you email sent to applicant');
      } catch (emailError) {
        console.log('❌ Failed to send thank you email:', emailError.message);
      }

      // 📧 Send HR notification email with resume attachment
      try {
        const hrEmailData = { ...dto, hasResume };
        await this.sendHRNotificationEmail(hrEmailData, resumePath);
        console.log('✅ HR notification email sent with resume attachment');
      } catch (emailError) {
        console.log('❌ Failed to send HR notification email:', emailError.message);
      }

      // Return result with resume URL for frontend
      const resultWithUrl = {
        ...result.toObject(),
        resumeDownloadUrl: result.resumeUrl ? `${process.env.BASE_URL || 'http://localhost:8090'}/${result.resumeUrl}` : null
      };
      
      return {
        status: 'success',
        message: 'Job application submitted successfully',
        data: resultWithUrl
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to submit job application',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }

  // ... rest of your existing methods remain the same (findAll, findOne, etc.)
  async findAll() {
    try {
      const applications = await this.jobApplicationModel.find().sort({ createdAt: -1 });
      
      const applicationsWithUrls = applications.map(app => {
        const appObject = app.toObject();
        return {
          ...appObject,
          resumeDownloadUrl: appObject.resumeUrl ? `${process.env.BASE_URL || 'http://localhost:8090'}/${appObject.resumeUrl}` : null
        };
      });
      
      return {
        status: 'success',
        message: 'Job applications fetched successfully',
        data: applicationsWithUrls
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch job applications',
        data: null
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: string) {
    try {
      const application = await this.jobApplicationModel.findById(id);
      
      if (!application) {
        throw new HttpException({
          status: 'error',
          message: 'Job application not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      const appObject = application.toObject();
      const applicationWithUrl = {
        ...appObject,
        resumeDownloadUrl: appObject.resumeUrl ? `${process.env.BASE_URL || 'http://localhost:8090'}/${appObject.resumeUrl}` : null
      };
      
      return {
        status: 'success',
        message: 'Job application fetched successfully',
        data: applicationWithUrl
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch job application',
        data: null
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async markAsReviewed(id: string) {
    try {
      const application = await this.jobApplicationModel.findByIdAndUpdate(
        id,
        { isReviewed: true },
        { new: true }
      );
      
      if (!application) {
        throw new HttpException({
          status: 'error',
          message: 'Job application not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      const appObject = application.toObject();
      const applicationWithUrl = {
        ...appObject,
        resumeDownloadUrl: appObject.resumeUrl ? `${process.env.BASE_URL || 'http://localhost:8090'}/${appObject.resumeUrl}` : null
      };
      
      return {
        status: 'success',
        message: 'Job application marked as reviewed successfully',
        data: applicationWithUrl
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to mark application as reviewed',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(id: string) {
    try {
      const application = await this.jobApplicationModel.findById(id);
      
      if (!application) {
        throw new HttpException({
          status: 'error',
          message: 'Job application not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      if (application.resumeUrl) {
        await this.deleteOldResume(application.resumeUrl);
      }

      await this.jobApplicationModel.findByIdAndDelete(id);
      
      return {
        status: 'success',
        message: 'Job application deleted successfully',
        data: null
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException({
        status: 'error',
        message: 'Failed to delete job application',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }
}