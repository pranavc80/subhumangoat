
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

        for (const sub of subscribers) {
            try {
                // Mock sending
                // console.log(`[EmailService] 📧 MOCK EMAIL to ${sub.email}: Storm Alert! Station ${stationId} is seeing ${intensity.toFixed(2)} in/hr (${category})`);

                // Real code
                await this.transporter.sendMail({
                    from: process.env.EMAIL_FROM || '"Cognisphere Weather" <alerts@cognisphere.com>',
                    to: sub.email,
                    subject: `⚠️ Storm Alert: ${category} Rain Event`,
                    text: `Heavy rain detected at station ${stationId}. Intensity: ${intensity.toFixed(2)} in/hr. Severity: ${category}.`,
                });
                console.log(`[EmailService] Sent email to ${sub.email}`);
            } catch (e) {
                console.error(`[EmailService] Failed to send to ${sub.email}`, e);
            }
        }
    }
}

export const emailService = new EmailService();
