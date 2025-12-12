// src/components/PlanetScene/shaders/planetShader.ts
import * as THREE from "three";

export type PlanetConfig = {
  elevationScale: number;
  mountainSharpness: number;
  oceanLevel: number;

  biomeColorA: THREE.Color;
  biomeColorB: THREE.Color;
  biomeColorC: THREE.Color;
  iceThreshold: number;

  // Extras
  lavaIntensity?: number;
  lavaThreshold?: number;

  sparkleIntensity?: number;
  sparkleSharpness?: number;

  parallaxScale?: number;
};

export function createPlanetUniforms(config: PlanetConfig) {
  return {
    uTime: { value: 0 },
    uLightDir: { value: new THREE.Vector3(1, 0.4, 0.2).normalize() },

    uElevationScale: { value: config.elevationScale },
    uMountainSharpness: { value: config.mountainSharpness },
    uOceanLevel: { value: config.oceanLevel },

    uBiomeColorA: { value: config.biomeColorA },
    uBiomeColorB: { value: config.biomeColorB },
    uBiomeColorC: { value: config.biomeColorC },
    uIceThreshold: { value: config.iceThreshold },

    uLavaIntensity: { value: config.lavaIntensity ?? 0.0 },
    uLavaThreshold: { value: config.lavaThreshold ?? 1.0 },

    uSparkleIntensity: { value: config.sparkleIntensity ?? 0.0 },
    uSparkleSharpness: { value: config.sparkleSharpness ?? 20.0 },

    uParallaxScale: { value: config.parallaxScale ?? 0.15 },
  };
}

export const planetVertexShader = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;

  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const planetFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vPos;
  varying vec3 vNormal;

  uniform float uTime;
  uniform vec3 uLightDir;

  uniform float uElevationScale;
  uniform float uMountainSharpness;
  uniform float uOceanLevel;

  uniform vec3 uBiomeColorA;
  uniform vec3 uBiomeColorB;
  uniform vec3 uBiomeColorC;
  uniform float uIceThreshold;

  uniform float uLavaIntensity;
  uniform float uLavaThreshold;

  uniform float uSparkleIntensity;
  uniform float uSparkleSharpness;

  uniform float uParallaxScale;

  // -------------------------------------------
  // HASH
  // -------------------------------------------
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  // -------------------------------------------
  // VALUE NOISE
  // -------------------------------------------
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    float n000 = hash(i + vec3(0,0,0));
    float n100 = hash(i + vec3(1,0,0));
    float n010 = hash(i + vec3(0,1,0));
    float n110 = hash(i + vec3(1,1,0));
    float n001 = hash(i + vec3(0,0,1));
    float n101 = hash(i + vec3(1,0,1));
    float n011 = hash(i + vec3(0,1,1));
    float n111 = hash(i + vec3(1,1,1));

    vec3 u = f*f*(3.0 - 2.0*f);

    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);

    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);

    return mix(nxy0, nxy1, u.z);
  }

  // -------------------------------------------
  // FBM NOISE
  // -------------------------------------------
  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 6; i++) {
      sum += amp * noise(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  // -------------------------------------------
  // RIDGED NOISE
  // -------------------------------------------
  float ridged(vec3 p) {
    float sum = 0.0;
    float freq = 1.0;
    float amp = 0.6;
    for (int i = 0; i < 5; i++) {
      float n = noise(p * freq);
      n = 1.0 - abs(n * 2.0 - 1.0);
      sum += n * amp;
      freq *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  // -------------------------------------------
  // PARALLAX NORMAL MAPPING
  // -------------------------------------------
  vec3 parallaxNormal(vec3 normal, vec3 position, float height, float scale) {
    vec3 dpdx = dFdx(position);
    vec3 dpdy = dFdy(position);

    float dhdx = dFdx(height);
    float dhdy = dFdy(height);

    vec3 n = normal - scale * (dhdx * dpdx + dhdy * dpdy);
    return normalize(n);
  }

  // -------------------------------------------
  // MAIN
  // -------------------------------------------
  void main() {
    vec3 p = normalize(vPos);

    float cont = fbm(p * 3.0 + uTime * 0.01) * uElevationScale;
    float mountains = ridged(p * 8.0) * uMountainSharpness;

    float height = cont + mountains;

    if (height < uOceanLevel) height = uOceanLevel;

    vec3 col = mix(uBiomeColorA, uBiomeColorB, smoothstep(0.05, 0.55, height));

    if (height > uIceThreshold) {
      col = uBiomeColorC;
    }

    // -------------------------------------------
    // LAVA EMISSION (volcanic planets)
    // -------------------------------------------
    float lavaMask = smoothstep(uLavaThreshold, uLavaThreshold + 0.1, mountains);
    lavaMask = pow(lavaMask, 3.0);
    lavaMask *= (0.8 + 0.2 * sin(uTime * 3.5 + p.x * 8.0));

    vec3 lavaColor = mix(vec3(0.9, 0.3, 0.05), vec3(1.0, 0.85, 0.4), lavaMask);
    vec3 emission = lavaColor * lavaMask * uLavaIntensity;

    // -------------------------------------------
    // ICE SPARKLE (frozen planets)
    // -------------------------------------------
    float sparkle = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    sparkle = pow(sparkle, uSparkleSharpness);

    float iceMask = smoothstep(uIceThreshold, uIceThreshold + 0.1, height);
    sparkle *= iceMask * uSparkleIntensity;

    vec3 sparkleColor = vec3(0.9, 0.95, 1.0) * sparkle;

    // -------------------------------------------
    // PARALLAX NORMAL UPDATE
    // -------------------------------------------
    vec3 N = normalize(vNormal);
    N = parallaxNormal(N, vPos, height, uParallaxScale);

    vec3 L = normalize(uLightDir);

    float diffuse = max(dot(N, L), 0.0);
    float atmos = pow(max(dot(N, -L), 0.0), 2.0);

    col = col * diffuse + vec3(0.25, 0.28, 0.32) * atmos;

    // -------------------------------------------
    // FINAL OUTPUT
    // -------------------------------------------
    gl_FragColor = vec4(col + emission + sparkleColor, 1.0);
  }
`;