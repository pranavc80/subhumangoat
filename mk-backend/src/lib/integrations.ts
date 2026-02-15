import { emailService } from "./emailService";
import type { ReturnPeriod } from "./idfData";

export interface Integration {
    sendAlert(message: string, stationId: string, intensity: number, category: ReturnPeriod, details?: object): Promise<void>;
}

export class EmailIntegration implements Integration {
    async sendAlert(message: string, stationId: string, intensity: number, category: ReturnPeriod): Promise<void> {
        await emailService.sendAlert(stationId, intensity, category);
    }
}


