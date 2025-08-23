import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact, ContactDocument } from './schema/contact.schema';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ContactService {
  private transporter: nodemailer.transporter;

  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
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
  // Email template for contact thank you
  private getContactThankYouTemplate(contactData: any): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Contacting Grab & Eat</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #E30613 0%, #FFD200 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .header p { color: rgba(255,255,255,0.95); font-size: 18px; }
        .content { padding: 40px 30px; }
        .thank-you-msg { text-align: center; margin-bottom: 30px; }
        .thank-you-msg h2 { color: #E30613; font-size: 24px; margin-bottom: 15px; }
        .thank-you-msg p { color: #555; font-size: 16px; line-height: 1.6; }
        .message-box { background: #f8f9fa; padding: 25px; border-radius: 10px; border-left: 5px solid #E30613; margin: 25px 0; }
        .message-box h3 { color: #E30613; margin-bottom: 10px; }
        .message-box p { color: #333; font-style: italic; }
        .next-steps { background: linear-gradient(135deg, #333 0%, #444 100%); color: white; padding: 25px; border-radius: 10px; margin: 25px 0; }
        .next-steps h3 { margin-bottom: 15px; }
        .next-steps ul { list-style: none; }
        .next-steps li { margin-bottom: 10px; padding-left: 20px; position: relative; }
        .next-steps li:before { content: "✓"; position: absolute; left: 0; color: #FFD200; font-weight: bold; }
        .contact-info { background: #FFD200; color: #333; padding: 20px; border-radius: 10px; text-align: center; }
        .footer { background: #333; color: white; padding: 25px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍔 Grab & Eat</h1>
          <p>Fresh • Fast • Tasty</p>
        </div>
        
        <div class="content">
          <div class="thank-you-msg">
            <h2>Thank You, ${contactData.name}! 🙏</h2>
            <p>We've received your message and truly appreciate you taking the time to contact us. Your feedback and inquiries help us serve you better!</p>
          </div>
          
          <div class="message-box">
            <h3>📝 Your Message:</h3>
            <p><strong>Subject:</strong> ${contactData.subject}</p>
            <p style="margin-top: 10px;">"${contactData.message}"</p>
          </div>
          
          <div class="next-steps">
            <h3>🚀 What Happens Next?</h3>
            <ul>
              <li>Our team will review your message within 24 hours</li>
              <li>We'll respond to your inquiry as soon as possible</li>
              <li>For urgent matters, feel free to call us directly</li>
              <li>Keep an eye on your inbox for our response</li>
            </ul>
          </div>
          
          <div class="contact-info">
            <h3>📞 Need Immediate Assistance?</h3>
            <p><strong>Phone:</strong> +32 123 456 789</p>
            <p><strong>Email:</strong> info@grabandeat.be</p>
            <p><strong>Address:</strong> Brussels, Belgium</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Grab & Eat - Belgium's Best Burger Experience</strong></p>
          <p>Thank you for choosing us! We can't wait to serve you.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Send thank you email to user
  private async sendThankYouEmail(contactData: any): Promise<void> {
    try {
      console.log('📧 Attempting to send email to:', contactData.email);

      const mailOptions = {
        from: this.configService.get<string>('USER_EMAIL'),
        to: contactData.email,
        subject: `🍔 Thank You for Contacting Grab & Eat!`,
        html: this.getContactThankYouTemplate(contactData),
      };

      console.log('📨 Mail options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      console.log('📬 Email response:', result.response);

    } catch (error) {
      console.error('❌ Detailed email error:', {
        message: error.message,
        code: error.code,
        command: error.command,
        stack: error.stack
      });
      throw error;
    }
  }

  async create(dto: CreateContactDto) {
    try {
      const contact = new this.contactModel(dto);
      const result = await contact.save();

      // 📧 Send thank you email to user
      try {
        await this.sendThankYouEmail(dto);
        console.log('✅ Contact thank you email sent to user');
      } catch (emailError) {
        console.log('❌ Failed to send thank you email:', emailError.message);
        // Don't throw error, form submission should still succeed
      }

      return {
        status: 'success',
        message: 'Contact form submitted successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to submit contact form',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    try {
      const contacts = await this.contactModel.find().sort({ createdAt: -1 });

      return {
        status: 'success',
        message: 'Contacts fetched successfully',
        data: contacts
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch contacts',
        data: null
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: string) {
    try {
      const contact = await this.contactModel.findById(id);

      if (!contact) {
        throw new HttpException({
          status: 'error',
          message: 'Contact not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      return {
        status: 'success',
        message: 'Contact fetched successfully',
        data: contact
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch contact',
        data: null
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async markAsRead(id: string) {
    try {
      const contact = await this.contactModel.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
      );

      if (!contact) {
        throw new HttpException({
          status: 'error',
          message: 'Contact not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      return {
        status: 'success',
        message: 'Contact marked as read successfully',
        data: contact
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException({
        status: 'error',
        message: 'Failed to mark contact as read',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(id: string) {
    try {
      const contact = await this.contactModel.findByIdAndDelete(id);

      if (!contact) {
        throw new HttpException({
          status: 'error',
          message: 'Contact not found',
          data: null
        }, HttpStatus.NOT_FOUND);
      }

      return {
        status: 'success',
        message: 'Contact deleted successfully',
        data: null
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException({
        status: 'error',
        message: 'Failed to delete contact',
        data: null
      }, HttpStatus.BAD_REQUEST);
    }
  }
}