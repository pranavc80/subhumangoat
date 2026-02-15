import type { ReturnPeriod } from "./idfData";
import type { StormStatus } from "./stormCategorizer";
import type { Integration } from "./integrations";

interface StationMonitorState {
    stationId: string;
    isUnderMonitoring: boolean;
    monitoringStartTime?: number;
    lastCategory?: string;
}

export class MonitoringService {
    private integrations: Integration[];
    private stationStates: Map<string, StationMonitorState> = new Map();
    private readonly MONITORING_DURATION_MS = 60 * 60 * 1000; // 1 hour

    constructor(integrations: Integration[]) {
        this.integrations = integrations;
    }

    /**
     * Process a new status reading for a station.
     */
    async processReading(stationId: string, status: StormStatus) {
        let state = this.stationStates.get(stationId);
        if (!state) {
            state = { stationId, isUnderMonitoring: false };
            this.stationStates.set(stationId, state);
        }

        const now = Date.now();

        // Check if we are currently under the "10 minute monitoring" window
        if (state.isUnderMonitoring) {
            if (now - (state.monitoringStartTime || 0) > this.MONITORING_DURATION_MS) {
                // Monitoring period expired
                state.isUnderMonitoring = false;
                state.monitoringStartTime = undefined;
                console.log(`[Monitoring] Station ${stationId} monitoring period ended.`);
            }
        }

        if (status.alertLevel !== "None") {
            const hasSeverityChanged = status.currentCategory !== state.lastCategory;

            if (!state.isUnderMonitoring || hasSeverityChanged) {
                // If severity changed during monitoring, just reset the window
                state.isUnderMonitoring = true;
                state.monitoringStartTime = now;
                state.lastCategory = status.currentCategory;

                // Trigger Alert
                await this.triggerAlerts(stationId, status);

                if (hasSeverityChanged && state.monitoringStartTime !== now) {
                    console.log(`[Monitoring] Station ${stationId} severity changed to ${status.currentCategory}. Triggering new alert.`);
                }
            } else {
                console.log(`[Monitoring] Station ${stationId} is ${status.alertLevel} (${status.currentCategory}) and already under monitoring. Skipping duplicate alert.`);
            }
        }
    }

    private async triggerAlerts(stationId: string, status: StormStatus) {
        const message = `🚨 **CRITICAL WEATHER ALERT** 🚨\nStation **${stationId}** has detected a **${status.currentCategory}** event!\nIntensity: ${status.maxIntensity.toFixed(2)} in/hr\nDuration: ${status.triggeringDuration} mins`;

        for (const integration of this.integrations) {
            await integration.sendAlert(message, stationId, status.maxIntensity, status.currentCategory as ReturnPeriod, status);
        }
    }
}
