/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USERNAME'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendMail(options: { to: string; subject: string; html: string }) {
    return await this.transporter.sendMail({
      from: `"Your ShoppyStore" <${this.configService.get('EMAIL_USER')}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}
