
// Thresholds for 40-minute duration specifically
// Return Period (Years) -> Intensity (Inches/Hour)
// 1.97 2.12 2.69 3.12 3.67 4.07 4.48
export const IDF_THRESHOLDS = [
    { year: 1, intensity: 1.97 },
    { year: 2, intensity: 2.12 },
    { year: 5, intensity: 2.69 },
    { year: 10, intensity: 3.12 },
    { year: 25, intensity: 3.67 },
    { year: 50, intensity: 4.07 },
    { year: 100, intensity: 4.48 },
].sort((a, b) => b.intensity - a.intensity); // Sort descending for priority

export const RETURN_PERIODS = ["1-Year", "2-Year", "5-Year", "10-Year", "25-Year", "50-Year", "100-Year"] as const;
export type ReturnPeriod = typeof RETURN_PERIODS[number];
