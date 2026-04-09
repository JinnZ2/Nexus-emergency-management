/**
 * Physics constants ported from JinnZ2/orbital-phycom core/physics_constants.py
 * All values in SI units unless noted.
 */

// Gravitational & Planetary
export const MU_EARTH = 3.986004418e14;         // m^3/s^2 - Earth's gravitational parameter
export const R_EARTH = 6_371_000;                // m - Earth's mean radius
export const R_EARTH_EQUATORIAL = 6_378_137;     // m - WGS84 equatorial radius
export const J2_EARTH = 1.08263e-3;              // Earth's J2 oblateness coefficient
export const STANDARD_GRAVITY = 9.80665;         // m/s^2
export const SPEED_OF_LIGHT = 299_792_458;       // m/s

// Solar & Radiation
export const SOLAR_RADIATION_PRESSURE = 4.56e-6; // N/m^2 at 1 AU

// RF & Communication
export const LAMBDA_RF = 0.1;                    // m - RF wavelength for phase tracking

// Default Satellite Properties (CubeSat-class)
export const DEFAULT_SATELLITE = {
  mass: 50,               // kg
  crossSection: 1,        // m^2
  dragCoefficient: 2.2,
  reflectivity: 1.2,
} as const;

// Reference Orbit
export const ALTITUDE_REF = 500_000;             // m (500 km)

// PHYCOM Protocol Specs
export const PHYCOM = {
  compressionRatio: 6944,
  dailyTransmissionBits: 144,
  seedValues: 15,
  seedBits: 120,
  deltaVMin: 0.0005,        // m/s - minimum detectable impulse
  deltaVMax: 0.002,         // m/s - maximum impulse
  dutyCycle: 0.0017,        // 0.17%
  propellantPerSymbol: 0.05, // grams
  effectiveCapacity: 0.117,  // bps post-expansion
  harmonicRatios: [2, 3, 5] as const,
} as const;

// Time
export const SECONDS_PER_DAY = 86_400;
export const SECONDS_PER_HOUR = 3_600;
export const SECONDS_PER_MINUTE = 60;
