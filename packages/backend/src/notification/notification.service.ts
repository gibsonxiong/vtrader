import { Injectable, Logger } from '@nestjs/common';
import type { NotificationData, BacktestNotificationData } from '../types/notification';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * 发送回测完成通知
   */
  async sendBacktestCompletedNotification(data: BacktestNotificationData): Promise<void> {
    try {
      this.logger.log(`发送回测完成通知: 任务ID ${data.jobId}`);
      
      // 这里可以实现多种通知方式
      await Promise.all([
        this.sendInAppNotification(data),
        // this.sendEmailNotification(data), // 可选：邮件通知
        // this.sendWebhookNotification(data), // 可选：Webhook通知
      ]);
      
      this.logger.log(`回测完成通知发送成功: 任务ID ${data.jobId}`);
    } catch (error) {
      this.logger.error(`发送回测完成通知失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 发送回测失败通知
   */
  async sendBacktestFailedNotification(data: BacktestNotificationData): Promise<void> {
    try {
      this.logger.log(`发送回测失败通知: 任务ID ${data.jobId}`);
      
      await Promise.all([
        this.sendInAppNotification(data),
        // this.sendEmailNotification(data), // 可选：邮件通知
      ]);
      
      this.logger.log(`回测失败通知发送成功: 任务ID ${data.jobId}`);
    } catch (error) {
      this.logger.error(`发送回测失败通知失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 发送应用内通知
   */
  private async sendInAppNotification(data: NotificationData): Promise<void> {
    try {
      // 这里可以实现应用内通知逻辑
      // 例如：保存到数据库、通过WebSocket推送到前端等
      
      this.logger.log(`应用内通知: ${data.title} - ${data.message}`);
      
      // 示例：可以在这里保存通知到数据库
      // await this.saveNotificationToDatabase(data);
      
      // 示例：可以在这里通过WebSocket推送通知
      // await this.pushNotificationViaWebSocket(data);
      
    } catch (error) {
      this.logger.error(`发送应用内通知失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 发送邮件通知（示例实现）
   */
  private async sendEmailNotification(data: NotificationData): Promise<void> {
    try {
      // 这里可以集成邮件服务，如 nodemailer、SendGrid 等
      this.logger.log(`邮件通知: ${data.title} - ${data.message}`);
      
      // 示例邮件发送逻辑
      // const emailService = new EmailService();
      // await emailService.send({
      //   to: data.userId ? await this.getUserEmail(data.userId) : 'admin@example.com',
      //   subject: data.title,
      //   html: this.generateEmailTemplate(data),
      // });
      
    } catch (error) {
      this.logger.error(`发送邮件通知失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 发送Webhook通知（示例实现）
   */
  private async sendWebhookNotification(data: NotificationData): Promise<void> {
    try {
      // 这里可以发送Webhook通知到外部系统
      this.logger.log(`Webhook通知: ${data.title} - ${data.message}`);
      
      // 示例Webhook发送逻辑
      // const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
      // if (webhookUrl) {
      //   await fetch(webhookUrl, {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(data),
      //   });
      // }
      
    } catch (error) {
      this.logger.error(`发送Webhook通知失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 保存通知到数据库（示例实现）
   */
  // private async saveNotificationToDatabase(data: NotificationData): Promise<void> {
  //   try {
  //     // 这里可以保存通知到数据库
  //     // await this.prisma.notification.create({
  //     //   data: {
  //     //     title: data.title,
  //     //     message: data.message,
  //     //     type: data.type,
  //     //     userId: data.userId,
  //     //     metadata: data.metadata,
  //     //     createdAt: new Date(),
  //     //   },
  //     // });
  //   } catch (error) {
  //     this.logger.error(`保存通知到数据库失败: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }

  /**
   * 通过WebSocket推送通知（示例实现）
   */
  // private async pushNotificationViaWebSocket(data: NotificationData): Promise<void> {
  //   try {
  //     // 这里可以通过WebSocket推送通知到前端
  //     // const wsGateway = this.moduleRef.get(WebSocketGateway);
  //     // wsGateway.sendNotification(data.userId, data);
  //   } catch (error) {
  //     this.logger.error(`WebSocket推送通知失败: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }

  /**
   * 生成邮件模板（示例实现）
   */
  private generateEmailTemplate(data: NotificationData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${data.title}</h2>
        <p style="color: #666; line-height: 1.6;">${data.message}</p>
        ${data.metadata ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">详细信息:</h3>
            <pre style="background: white; padding: 10px; border-radius: 3px; overflow-x: auto;">
${JSON.stringify(data.metadata, null, 2)}
            </pre>
          </div>
        ` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          此邮件由VTrader系统自动发送，请勿回复。
        </p>
      </div>
    `;
  }
}
