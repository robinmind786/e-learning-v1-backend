import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface UserData {
  user: {
    email: string;
  };
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

type AdditionalData = Record<string, any>;

export default class SendEmail {
  private readonly data: UserData;
  private readonly to: string | undefined;
  private readonly from: string;

  constructor(data: UserData) {
    this.data = data;
    this.to = data.user?.email;
    this.from = `Robin Mind <${process.env.EMAIL_FROM}>`;
  }

  private newTransport(): Transporter {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  public async send(
    template: string,
    subject: string,
    additionalData: AdditionalData = {}
  ): Promise<void> {
    try {
      const templatePath = path.join(
        __dirname,
        `../views/emails/${template}.ejs`
      );
      const html = await ejs.renderFile(templatePath, {
        data: { ...this.data, ...additionalData },
        subject,
      });

      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        attachments: this.data.attachments ?? [],
      };

      await this.newTransport().sendMail(mailOptions);
    } catch (error: any) {
      console.error(`Error sending email: ${error.message}`);
      throw error;
    }
  }

  public async verifyAccount(): Promise<void> {
    await this.send("verifyAccount", "Email verification");
  }
}
