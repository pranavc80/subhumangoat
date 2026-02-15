import { IDF_THRESHOLDS } from "./idfData";
import type { ReturnPeriod } from "./idfData";

export interface RainfallReading {
    timestamp: Date;
    inches: number;
}

export interface StormStatus {
    currentCategory: ReturnPeriod | "Normal";
    maxIntensity: number; // inches/hr
    triggeringDuration: number; // minutes
    alertLevel: "None" | "Medium" | "Critical";
}

export class StormCategorizer {
    private readings: RainfallReading[] = [];
    private readonly MAX_WINDOW_MINUTES = 60;

    addReading(inches: number, timestamp: Date) {
        // Prevent duplicate/stale readings
        if (this.readings.length > 0) {
            const last = this.readings[this.readings.length - 1]!;
            if (last.timestamp.getTime() === timestamp.getTime()) {
                return;
            }
        }
        this.readings.push({ inches, timestamp });
        this.pruneReadings();
    }

    private pruneReadings() {
        const cutoff = new Date(Date.now() - (this.MAX_WINDOW_MINUTES + 30) * 60000);
        this.readings = this.readings.filter((r) => r.timestamp > cutoff);
        this.readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    checkStatus(): StormStatus {
        if (this.readings.length === 0) {
            return {
                currentCategory: "Normal",
                maxIntensity: 0,
                triggeringDuration: 0,
                alertLevel: "None",
            };
        }

        const lastReading = this.readings[this.readings.length - 1]!;

        // Calculate intensity based on the simplified 30-minute reading
        // Intensity = Inches / 0.5 hours
        const intensity = lastReading.inches / 0.5;

        // Find the highest threshold met
        let category: ReturnPeriod | "Normal" = "Normal";
        let alertLevel: "None" | "Medium" | "Critical" = "None";

        for (const threshold of IDF_THRESHOLDS) {
            if (intensity >= threshold.intensity) {
                category = `${threshold.year}-Year` as ReturnPeriod;

                // Determine alert level (1-Year+ is Medium, 10-Year+ is Critical)
                if (threshold.year >= 10) {
                    alertLevel = "Critical";
                } else if (threshold.year >= 1) {
                    alertLevel = "Medium";
                }

                break; // Stopped because we sorted descending
            }
        }

        return {
            currentCategory: category,
            maxIntensity: intensity,
            triggeringDuration: 30, // Data cadence
            alertLevel,
        };
    }
}
