import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./auth-schema";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    session: {
        expiresIn: 3600, // 1 hour
        updateAge: 600, // Update session every 10 minutes of activity
    },
    emailAndPassword: {
        enabled: true,
    },
    emailVerification: {
        async sendVerificationEmail({ user, url }: { user: { email: string; name?: string }; url: string }) {
            if (!resend) {
                console.error("Resend API key missing. Cannot send verification email.");
                return;
            }
            await resend.emails.send({
                from: "MAPmobile Co <onboarding@resend.dev>",
                to: user.email,
                subject: "Verify your email - MAPmobile Co",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Verify Your Identity - MAPmobile Co</title>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #ffffff; background-color: #050505; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 40px auto; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                            .header { background: linear-gradient(135deg, #0066ff 0%, #0044aa 100%); padding: 60px 40px; text-align: center; }
                            .logo { font-size: 32px; font-weight: 900; letter-spacing: -1px; color: #ffffff; margin-bottom: 10px; }
                            .logo span { color: #99ccff; }
                            .content { padding: 40px; text-align: center; }
                            h1 { font-size: 28px; font-weight: 800; margin-bottom: 20px; color: #ffffff; text-transform: uppercase; letter-spacing: -0.5px; }
                            p { font-size: 16px; color: #a0a0a0; margin-bottom: 30px; }
                            .button { display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #0066ff 0%, #0044aa 100%); color: #ffffff !important; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(0, 102, 255, 0.2); transition: all 0.3s ease; }
                            .footer { padding: 30px 40px; background-color: #050505; text-align: center; border-top: 1px solid #1a1a1a; }
                            .footer p { font-size: 12px; color: #444444; margin: 5px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">MAP<span>mobile</span> CO</div>
                                <div style="font-size: 14px; font-weight: 700; letter-spacing: 3px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Premium Mobile Electronics</div>
                            </div>
                            <div class="content">
                                <h1>Verify Your Identity</h1>
                                <p>Welcome, ${user.name}. You're just one step away from accessing professional-grade mobile electronics and expert installation services.</p>
                                <a href="${url}" class="button">Confirm Account</a>
                                <p style="margin-top: 30px; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:</p>
                                <p style="font-size: 12px; color: #444444; word-break: break-all;">${url}</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2025 MAPmobile CO. ALL RIGHTS RESERVED.</p>
                                <p>PROFESSIONAL INSTALLATION | PREMIUM GEAR</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });
        },
        async sendResetPassword({ user, url }: { user: { email: string; name?: string }; url: string }) {
            if (!resend) {
                console.error("Resend API key missing. Cannot send reset password email.");
                return;
            }
            await resend.emails.send({
                from: "MAPmobile Co <onboarding@resend.dev>",
                to: user.email,
                subject: "Reset your password - MAPmobile Co",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Reset Your Password - MAPmobile Co</title>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #ffffff; background-color: #050505; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 40px auto; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                            .header { background: linear-gradient(135deg, #0066ff 0%, #0044aa 100%); padding: 60px 40px; text-align: center; }
                            .logo { font-size: 32px; font-weight: 900; letter-spacing: -1px; color: #ffffff; margin-bottom: 10px; }
                            .logo span { color: #99ccff; }
                            .content { padding: 40px; text-align: center; }
                            h1 { font-size: 28px; font-weight: 800; margin-bottom: 20px; color: #ffffff; text-transform: uppercase; letter-spacing: -0.5px; }
                            p { font-size: 16px; color: #a0a0a0; margin-bottom: 30px; }
                            .button { display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #0066ff 0%, #0044aa 100%); color: #ffffff !important; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(0, 102, 255, 0.2); transition: all 0.3s ease; }
                            .footer { padding: 30px 40px; background-color: #050505; text-align: center; border-top: 1px solid #1a1a1a; }
                            .footer p { font-size: 12px; color: #444444; margin: 5px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">MAP<span>mobile</span> CO</div>
                                <div style="font-size: 14px; font-weight: 700; letter-spacing: 3px; color: rgba(255,255,255,0.6); text-transform: uppercase;">Premium Mobile Electronics</div>
                            </div>
                            <div class="content">
                                <h1>Reset Your Password</h1>
                                <p>Hello ${user.name}. We received a request to reset your password. If you made this request, click the button below to secure your account.</p>
                                <a href="${url}" class="button">Reset Password</a>
                                <p style="margin-top: 30px; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:</p>
                                <p style="font-size: 12px; color: #444444; word-break: break-all;">${url}</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2025 MAPmobile CO. ALL RIGHTS RESERVED.</p>
                                <p>PROFESSIONAL INSTALLATION | PREMIUM GEAR</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });
        },
    },
    trustedOrigins: ["*"],
});
