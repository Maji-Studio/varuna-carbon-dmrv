// ============================================
// Vehicle and Transport Constants
// ============================================

// Vehicle type options for forms
export const VEHICLE_TYPES = [
  { value: "truck", label: "Truck" },
  { value: "pickup", label: "Pickup" },
  { value: "tractor", label: "Tractor" },
  { value: "electric", label: "Electric" },
  { value: "other", label: "Other" },
] as const;

// Fuel type options for forms
export const FUEL_TYPES = [
  { value: "diesel", label: "Diesel" },
  { value: "petrol", label: "Petrol" },
  { value: "electric", label: "Electric" },
  { value: "other", label: "Other" },
] as const;

// Vehicle type to default fuel type mapping
export const VEHICLE_FUEL_MAP: Record<string, string> = {
  truck: "diesel",
  pickup: "diesel",
  tractor: "diesel",
  electric: "electric",
  other: "diesel", // default
};

// Fuel consumption rates in L/km
// TODO: Make these configurable via admin settings
export const FUEL_CONSUMPTION_RATES: Record<string, number> = {
  truck: 0.3, // ~0.3 L/km
  pickup: 0.15, // ~0.15 L/km
  tractor: 0.25, // ~0.25 L/km
  electric: 0, // No fuel (electricity tracked separately)
  other: 0.2, // default estimate
};

// Vehicle types that don't require fuel tracking
export const NO_FUEL_VEHICLES = ["electric"];

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate distance between two GPS points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers (rounded to 1 decimal)
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate fuel consumed based on vehicle type and distance
 * @param vehicleType - Type of vehicle (truck, pickup, etc.)
 * @param distanceKm - Distance traveled in kilometers
 * @returns Fuel consumed in liters (rounded to 1 decimal)
 */
export function calculateFuelConsumed(
  vehicleType: string,
  distanceKm: number
): number {
  const rate =
    FUEL_CONSUMPTION_RATES[vehicleType.toLowerCase()] ??
    FUEL_CONSUMPTION_RATES.other;
  return Math.round(rate * distanceKm * 10) / 10; // Round to 1 decimal
}

/**
 * Get the default fuel type for a vehicle type
 * @param vehicleType - Type of vehicle
 * @returns Default fuel type or undefined if no fuel needed
 */
export function getDefaultFuelType(vehicleType: string): string | undefined {
  const fuelType = VEHICLE_FUEL_MAP[vehicleType.toLowerCase()];
  if (fuelType === "electric" || NO_FUEL_VEHICLES.includes(vehicleType.toLowerCase())) {
    return undefined;
  }
  return fuelType;
}

/**
 * Check if a vehicle type requires fuel tracking
 * @param vehicleType - Type of vehicle
 * @returns true if vehicle needs fuel tracking
 */
export function requiresFuelTracking(vehicleType: string): boolean {
  return !NO_FUEL_VEHICLES.includes(vehicleType.toLowerCase());
}
