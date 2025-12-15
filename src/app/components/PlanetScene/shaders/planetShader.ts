import * as THREE from "three";
import { NormalizedPlanetConfig } from "./planetTypes";

export function createPlanetUniforms(cfg: NormalizedPlanetConfig) {
  return {
    uTime: { value: 0 },
    uLightDir: { value: new THREE.Vector3(1, 0.4, 0.2).normalize() },

    uElevationScale: { value: cfg.elevationScale },
    uMountainSharpness: { value: cfg.mountainSharpness },
    uOceanLevel: { value: cfg.oceanLevel },

    uBiomeColorA: { value: cfg.biomeColorA },
    uBiomeColorB: { value: cfg.biomeColorB },
    uBiomeColorC: { value: cfg.biomeColorC },

    uIceThreshold: { value: cfg.iceThreshold },
    uParallaxScale: { value: cfg.parallaxScale },

    uLavaIntensity: { value: cfg.lavaIntensity },
    uLavaThreshold: { value: cfg.lavaThreshold },

    uSparkleIntensity: { value: cfg.sparkleIntensity },
    uSparkleSharpness: { value: cfg.sparkleSharpness },
  };
}

export const planetVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;

  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position =
      projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const planetFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vNormal;
  varying vec3 vPos;

  uniform vec3 uLightDir;
  uniform vec3 uBiomeA;
  uniform vec3 uBiomeB;
  uniform vec3 uBiomeC;
  uniform float uIceThreshold;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f*f*(3.0-2.0*f);

    float n000 = hash(i);
    float n100 = hash(i+vec3(1,0,0));
    float n010 = hash(i+vec3(0,1,0));
    float n110 = hash(i+vec3(1,1,0));
    float n001 = hash(i+vec3(0,0,1));
    float n101 = hash(i+vec3(1,0,1));
    float n011 = hash(i+vec3(0,1,1));
    float n111 = hash(i+vec3(1,1,1));

    float nx00 = mix(n000,n100,u.x);
    float nx10 = mix(n010,n110,u.x);
    float nx01 = mix(n001,n101,u.x);
    float nx11 = mix(n011,n111,u.x);
    float nxy0 = mix(nx00,nx10,u.y);
    float nxy1 = mix(nx01,nx11,u.y);
    return mix(nxy0,nxy1,u.z);
  }

  void main() {
    vec3 p = normalize(vPos);
    float h = noise(p * 4.0);

    vec3 col = mix(uBiomeA, uBiomeB, h);
    col = mix(col, uBiomeC, smoothstep(uIceThreshold, 1.0, h));

    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);
    float diff = max(dot(N,L),0.0);

    gl_FragColor = vec4(col * (0.3 + diff * 0.7), 1.0);
  }
`;