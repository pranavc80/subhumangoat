import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import type { ReturnPeriod } from "./idfData";

interface Subscriber {
    email: string;
    subscribedAt?: string;
}

export class EmailService {
    private subscribersFile = path.join(process.cwd(), "subscribers.json");
    private transporter;

    constructor() {
        // Initialize using environment variables
        if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            console.log(`[EmailService] Configured with host: ${process.env.EMAIL_HOST}`);
        } else {
            console.log("[EmailService] No email credentials found in env. Using Mock/Ethereal default.");
            this.transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: "test@ethereal.email",
                    pass: "test",
                },
            });
        }
    }

    async subscribe(email: string) {
        const subscribers = this.getSubscribers();
        if (subscribers.find(s => s.email === email)) {
            return false; // Already subscribed
        }

        subscribers.push({
            email,
            subscribedAt: new Date().toISOString()
        });

        fs.writeFileSync(this.subscribersFile, JSON.stringify(subscribers, null, 2));
        console.log(`[EmailService] New subscriber: ${email}`);
        return true;
    }

    getSubscribers(): Subscriber[] {
        try {
            const data = fs.readFileSync(this.subscribersFile, "utf-8");
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    async sendAlert(stationId: string, intensity: number, category: ReturnPeriod) {
        const subscribers = this.getSubscribers();
        if (subscribers.length === 0) return;

        console.log(`[EmailService] Sending alert to ${subscribers.length} subscribers for station ${stationId}`);

        const appUrl = process.env.PUBLIC_APP_URL || "[YOUR_DEPLOYED_URL]";
        const currentTime = new Date().toLocaleString('en-US', { 
            timeZone: 'America/Chicago',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
            month: 'short',
            day: 'numeric'
        });

        for (const sub of subscribers) {
            try {
                await this.transporter.sendMail({
                    from: process.env.EMAIL_FROM || '"Cognisphere Weather" <alerts@cognisphere.com>',
                    to: sub.email,
                    subject: `⚠️ Storm Alert: ${stationId}`,
                    text: `Storm Alert!\n\nSensor ID: ${stationId}\nIntensity: ${intensity.toFixed(2)} in/hr\nTime: ${currentTime}\n\nView Map: ${appUrl}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 400px; border: 1px solid #eee; border-radius: 8px;">
                            <h2 style="color: #d32f2f; margin-top: 0;">⚠️ Storm Alert</h2>
                            <p style="margin: 8px 0;"><strong>Sensor ID:</strong> ${stationId}</p>
                            <p style="margin: 8px 0;"><strong>Intensity:</strong> ${intensity.toFixed(2)} in/hr</p>
                            <p style="margin: 8px 0;"><strong>Time:</strong> ${currentTime}</p>
                            <p style="margin-top: 20px;"><a href="${appUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Real-time Map</a></p>
                        </div>
                    `
                });
                console.log(`[EmailService] Sent ultra-simplified alert to ${sub.email}`);
            } catch (e) {
                console.error(`[EmailService] Failed to send to ${sub.email}`, e);
            }
        }
    }
}

export const emailService = new EmailService();
