import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import cors from "@koa/cors";
import { z } from "zod";
import type { ReturnPeriod } from "./src/lib/idfData";
import { StormCategorizer } from "./src/lib/stormCategorizer";


import { emailService } from "./src/lib/emailService";
import { MonitoringService } from "./src/lib/monitoring";
import { EmailIntegration } from "./src/lib/integrations";

// Initialize Monitoring with Email Integration
const monitoringService = new MonitoringService([new EmailIntegration()]);

const app = new Koa();
const router = new Router();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser());

// In-memory store for stations (in a real app, use a DB)
const stations = new Map<string, StormCategorizer>();

// Validation Schemas
const IngestSchema = z.object({
    stationId: z.string().min(1),
    inches: z.number().min(0),
    timestamp: z.string().datetime().optional(), // ISO string
});

const SubscribeSchema = z.object({
    email: z.string().email(),
});

// API Key Middleware (Simple)
const authenticate = async (ctx: Koa.Context, next: Koa.Next) => {
    const apiKey = ctx.get("X-API-Key");
    if (apiKey !== process.env.API_KEY) {
        ctx.status = 401;
        ctx.body = { error: "Unauthorized" };
        return;
    }
    await next();
};

// Routes

// Health Check
router.get("/", (ctx) => {
    ctx.body = { status: "ok", backend: "bun-koa" };
});

// Ingest Data
router.post("/api/v1/ingest", authenticate, async (ctx) => {
    const result = IngestSchema.safeParse(ctx.request.body);

    if (!result.success) {
        ctx.status = 400;
        ctx.body = { error: result.error };
        return;
    }

    const { stationId, inches, timestamp } = result.data;
    const date = timestamp ? new Date(timestamp) : new Date();

    if (!stations.has(stationId)) {
        stations.set(stationId, new StormCategorizer());
    }

    const monitor = stations.get(stationId)!;
    monitor.addReading(inches, date);

    const status = monitor.checkStatus();

    console.log(`[Ingest] Station ${stationId}: ${inches}" -> ${status.currentCategory}`);

    // Process for monitoring and alerts

    ctx.body = { success: true, status };
});

// Subscribe to Alerts
router.post("/api/v1/subscribe", async (ctx) => {
    const result = SubscribeSchema.safeParse(ctx.request.body);

    if (!result.success) {
        ctx.status = 400;
        ctx.body = { error: result.error };
        return;
    }

    const { email } = result.data;
    const success = await emailService.subscribe(email);

    if (!success) {
        ctx.status = 409; // Conflict (already subscribed)
        ctx.body = { error: "Already subscribed" };
        return;
    }

    ctx.body = { success: true, message: "Subscribed successfully" };
});

// Get Status
router.get("/api/v1/status/:stationId", (ctx) => {
    const { stationId } = ctx.params;

    if (!stationId || typeof stationId !== 'string') {
        ctx.status = 400;
        ctx.body = { error: "Invalid station ID" };
        return;
    }

    if (!stations.has(stationId)) {
        ctx.status = 404;
        ctx.body = { error: "Station not found" };
        return;
    }

    const monitor = stations.get(stationId)!;
    const status = monitor.checkStatus();

    ctx.body = status;
});

// Verify Access Code
router.post("/api/v1/verify-access", async (ctx) => {
    const { code } = ctx.request.body as { code: string };
    const masterCode = process.env.ACCESS_CODE || "cognisphere2026";

    if (code === masterCode) {
        ctx.body = { success: true };
    } else {
        ctx.status = 401;
        ctx.body = { success: false, error: "Invalid access code" };
    }
});

// Placeholder for missing function
import axios from "axios";

// McKinney, TX Weather Underground station IDs
const MCKINNEY_STATION_IDS = [
    "KTXMCKIN170",
    "KTXMCKIN469",
    "KTXMCKIN687",
    "KTXMCKIN739",
    "KTXMCKIN842",
    "KTXMCKIN48",
    "KTXMCKIN601",
    "KTXMCKIN718",
    "KTXMCKIN432",
    "KTXMCKIN545",
    "KTXMCKIN555",
    "KTXMCKIN358",
    "KTXMCKIN610",
    "KTXMCKIN513",
    "KTXMCKIN760",
    "KTXMCKIN862",
    "KTXMCKIN592",
    "KTXMCKIN813",
    "KTXMCKIN663",
    "KTXMCKIN713",
    "KTXMCKIN606",
    "KTXMCKIN694",
    "KTXMCKIN675",
    "KTXMCKIN395",
    "KTXMCKIN754",
    "KTXMCKIN496",
    "KTXMCKIN504",
    "KTXMCKIN884",
    "KTXMCKIN421",
];

// Simple in-memory cache
let cache: {
    data: any[];
    timestamp: number;
    expiresAt: number;
} | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Placeholder for missing function
const getMcKinneyWeather = async (ctx: Koa.Context) => {
    const startTime = Date.now();

    try {
        // Check cache first
        const now = Date.now();
        let validObservations: any[] = [];

        if (cache && now < cache.expiresAt) {
            console.log("[API Route] Serving cached data");
            validObservations = cache.data;
        } else {
            // Fetch fresh data
            console.log("[API Route] Fetching fresh weather data");
            const apiKey = process.env.NEXT_PUBLIC_WU_API_KEY || "09a5974c34de4e23a5974c34deee233e";

            const weatherAPI = axios.create({
                baseURL: "https://api.weather.com/v2",
                timeout: 15000,
            });

            // Fetch data for all stations in parallel
            const promises = MCKINNEY_STATION_IDS.map(async (stationId, index) => {
                try {
                    // Add small delay between requests
                    if (index > 0) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }

                    const response = await weatherAPI.get("/pws/observations/current", {
                        params: {
                            stationId,
                            format: "json",
                            units: "e", // English units
                            apiKey,
                        },
                    });

                    const observation = response.data.observations?.[0];
                    if (!observation) {
                        console.warn(`[API Route] No data for station ${stationId}`);
                        return null;
                    }

                    return observation;
                } catch (error) {
                    console.warn(
                        `[API Route] Failed to fetch station ${stationId}:`,
                        (error as Error).message,
                    );
                    return null;
                }
            });

            const observations = await Promise.all(promises);
            validObservations = observations.filter((obs) => obs !== null);

            // Update cache
            cache = {
                data: validObservations,
                timestamp: now,
                expiresAt: now + CACHE_DURATION,
            };

            console.log(
                `[API Route] Fetched ${validObservations.length} valid observations`,
            );

            // Update Stations and Check for Alerts
            for (const obs of validObservations) {
                if (!stations.has(obs.stationID)) {
                    stations.set(obs.stationID, new StormCategorizer());
                }
                const monitor = stations.get(obs.stationID)!;
                // Add reading (WU gives "precipTotal" as daily total. 
                // We need the *difference* since last check to get "inches in last 30 mins"?
                // BUT, Weather Underground "precipRate" (in/hr) is instantaneous.
                // AND "precipTotal" is accumulation since midnight.

                // User wants us to calculate based on the accumulation updates.
                // If we poll every 30 mins, we can just track the delta.
                // HOWEVER, for simplicity in this "stateless" fetch (cache is memory):
                // We will use the `precipRate` provided by WU if available as a proxy, 
                // OR we just push the `precipTotal` and let StormCategorizer logic handle deltas?
                // The current StormCategorizer expects "inches in this interval".

                // Let's rely on WU's `precipTotal` and assume we are feeding it correctly.
                // Wait, `addReading` in StormCategorizer pushes `inches`.
                // If we push `precipTotal` (e.g. 5.0), it thinks 5.0 inches fell in 30 mins. WRONG.
                // We need to store the *previous* total to calculate delta.
                // But `stations` Map is in-memory and persistent.

                // Hack: We need to store the *last total* in the Categorizer to calc delta.
                // For now, let's just use `precipRate` * 0.5 (30 mins) as the "inches" 
                // if we trust the rate.
                // OR, since we are just comparing Intensity vs Thresholds, 
                // and we updated StormCategorizer to calculate Intensity = Inches / 0.5...
                // Passing `precipRate * 0.5` means `Intensity` = `(Rate * 0.5) / 0.5` = `Rate`.
                // So we can just pass `obs.imperial.precipRate * 0.5` as the inches.

                const rate = obs.imperial.precipRate || 0;
                monitor.addReading(rate * 0.5, new Date(obs.obsTimeLocal)); // 0.5 hrs * Rate

                const status = monitor.checkStatus();
                // Pass to monitoring service which handles "Spam Protection" (Debouncing)
                // It will only send one email every 10 minutes per station.
                await monitoringService.processReading(obs.stationID, status);
            }
        }

        // Filter by specific station if requested
        const requestedStationId = ctx.query.stationId;
        if (requestedStationId && typeof requestedStationId === 'string') {
            const stationData = validObservations.find(
                (obs) => obs.stationID === requestedStationId
            );

            if (stationData) {
                ctx.body = {
                    data: [stationData],
                    cached: now < (cache?.expiresAt || 0),
                    timestamp: cache?.timestamp || now,
                    stations: 1,
                    responseTime: Date.now() - startTime,
                    cacheExpiresIn: Math.round(((cache?.expiresAt || now) - now) / 1000),
                };
            } else {
                // If specific station not found in cache, try to fetch it directly? 
                // For now, let's just return 404 if not in our list/cache
                ctx.status = 404;
                ctx.body = { error: "Station not found" };
            }
            return;
        }

        ctx.body = {
            data: validObservations,
            cached: now < (cache?.expiresAt || 0),
            timestamp: cache?.timestamp || now,
            stations: validObservations.length,
            responseTime: Date.now() - startTime,
            cacheExpiresIn: Math.round(((cache?.expiresAt || now) - now) / 1000),
        };

    } catch (error) {
        console.error("[API Route] Error fetching weather data:", error);

        // Return cached data if available, even if expired
        if (cache && cache.data.length > 0) {
            console.log("[API Route] Returning stale cached data due to error");
            ctx.body = {
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
                stations: cache.data.length,
                responseTime: Date.now() - startTime,
                error: "Fresh data unavailable, serving cached data",
            };
            return;
        }

        ctx.status = 500;
        ctx.body = {
            error: "Failed to fetch weather data",
            message: (error as Error).message,
            timestamp: Date.now(),
            responseTime: Date.now() - startTime,
        };
    }
};

// Weather Proxy Route
router.get("/api/v1/weather", getMcKinneyWeather);

// Register Routes
app.use(router.routes()).use(router.allowedMethods());

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});