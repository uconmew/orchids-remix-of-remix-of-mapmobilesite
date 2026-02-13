import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ 
  to, 
  subject, 
  html, 
  from = "MAPmobile <onboarding@resend.dev>" 
}: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw error;
  }
}
