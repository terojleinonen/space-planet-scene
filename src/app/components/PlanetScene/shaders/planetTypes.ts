// src/components/PlanetScene/shaders/planetTypes.ts
import * as THREE from "three";

export type LavaFeature = {
  lavaIntensity: number;
  lavaThreshold: number;
};

export type SparkleFeature = {
  sparkleIntensity: number;
  sparkleSharpness: number;
};

export type PlanetConfig = {
  elevationScale: number;
  mountainSharpness: number;
  oceanLevel: number;

  biomeColorA: THREE.Color;
  biomeColorB: THREE.Color;
  biomeColorC: THREE.Color;

  iceThreshold: number;
  parallaxScale?: number;

  // Optional features
  lava?: LavaFeature;
  sparkle?: SparkleFeature;
};

export type NormalizedPlanetConfig = {
  elevationScale: number;
  mountainSharpness: number;
  oceanLevel: number;

  biomeColorA: THREE.Color;
  biomeColorB: THREE.Color;
  biomeColorC: THREE.Color;

  iceThreshold: number;
  parallaxScale: number;

  // Always present (safe defaults)
  lavaIntensity: number;
  lavaThreshold: number;
  sparkleIntensity: number;
  sparkleSharpness: number;
};

export function normalizePlanetConfig(
  config: PlanetConfig
): NormalizedPlanetConfig {
  return {
    elevationScale: config.elevationScale,
    mountainSharpness: config.mountainSharpness,
    oceanLevel: config.oceanLevel,

    biomeColorA: config.biomeColorA,
    biomeColorB: config.biomeColorB,
    biomeColorC: config.biomeColorC,

    iceThreshold: config.iceThreshold,
    parallaxScale: config.parallaxScale ?? 0.15,

    // Lava (safe even if missing)
    lavaIntensity: config.lava?.lavaIntensity ?? 0.0,
    lavaThreshold: config.lava?.lavaThreshold ?? 1.0,

    // Sparkle (safe even if missing)
    sparkleIntensity: config.sparkle?.sparkleIntensity ?? 0.0,
    sparkleSharpness: config.sparkle?.sparkleSharpness ?? 20.0,
  };
}