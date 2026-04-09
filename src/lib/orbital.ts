/**
 * Orbital mechanics utilities - TypeScript port of key functions
 * from JinnZ2/orbital-phycom core/orbital_dynamics.py
 */

import {
  MU_EARTH,
  R_EARTH,
  J2_EARTH,
  R_EARTH_EQUATORIAL,
  ALTITUDE_REF,
  LAMBDA_RF,
} from './constants';

/** Compute circular orbital velocity at a given altitude (m) */
export function circularVelocity(altitude: number = ALTITUDE_REF): number {
  const r = R_EARTH + altitude;
  return Math.sqrt(MU_EARTH / r);
}

/** Compute orbital period in seconds for a given altitude (m) */
export function orbitalPeriod(altitude: number = ALTITUDE_REF): number {
  const r = R_EARTH + altitude;
  return 2 * Math.PI * Math.sqrt(r ** 3 / MU_EARTH);
}

/** Compute J2 precession rate (rad/s) for a given semi-major axis and inclination */
export function j2PrecessionRate(semiMajorAxis: number, inclination: number): number {
  const n = Math.sqrt(MU_EARTH / semiMajorAxis ** 3);
  const p = semiMajorAxis / R_EARTH_EQUATORIAL;
  return -1.5 * n * J2_EARTH * (1 / p ** 2) * Math.cos(inclination);
}

/** Compute RF phase rate between two satellites given range-rate */
export function phaseRate(rangeRate: number): number {
  return (2 * Math.PI * rangeRate) / LAMBDA_RF;
}

/** Compute gravitational acceleration magnitude at altitude */
export function gravityAt(altitude: number): number {
  const r = R_EARTH + altitude;
  return MU_EARTH / r ** 2;
}

/** Node health classification based on orbital eccentricity */
export function classifyHealth(eccentricity: number): 'nominal' | 'degraded' | 'critical' {
  if (eccentricity < 0.01) return 'nominal';
  if (eccentricity < 0.05) return 'degraded';
  return 'critical';
}
