// src/components/PlanetScene/shaders/planetShader.ts
import * as THREE from "three";

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
  uniform float uOceanLevel;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

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

  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for(int i = 0; i < 6; i++) {
      sum += amp * noise(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  float ridged(vec3 p) {
    float sum = 0.0;
    float freq = 1.0;
    float amp = 0.5;
    for(int i = 0; i < 4; i++){
      float n = noise(p * freq);
      n = 1.0 - abs(n * 2.0 - 1.0);
      sum += n * amp;
      freq *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }

  vec3 oceanColor = vec3(0.0, 0.15, 0.35);
  vec3 sandColor  = vec3(0.76, 0.70, 0.50);
  vec3 grassColor = vec3(0.25, 0.55, 0.25);
  vec3 rockColor  = vec3(0.35, 0.30, 0.28);
  vec3 snowColor  = vec3(1.0, 1.0, 1.0);

  vec3 terrainColor(float h) {
    if (h < 0.02) return oceanColor;
    if (h < 0.06) return mix(oceanColor, sandColor, smoothstep(0.0, 0.06, h));
    if (h < 0.25) return mix(sandColor, grassColor, smoothstep(0.06, 0.25, h));
    if (h < 0.6)  return mix(grassColor, rockColor, smoothstep(0.25, 0.6, h));
    return mix(rockColor, snowColor, smoothstep(0.6, 1.0, h));
  }

  void main() {
    vec3 p = normalize(vPos);

    float cont = fbm(p * 3.0 + uTime * 0.01);
    float mountains = ridged(p * 8.0);

    float height = cont * 0.6 + mountains * 0.4;
    if (height < uOceanLevel) height = uOceanLevel;

    vec3 col = terrainColor(height);

    float diffuse = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    float atmos = pow(max(0.0, dot(normalize(vNormal), normalize(-uLightDir))), 2.0);

    col = col * diffuse + vec3(0.2, 0.25, 0.3) * atmos;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createPlanetUniforms() {
  return {
    uTime: { value: 0 },
    uLightDir: {
      value: new THREE.Vector3(1, 0.4, 0.2).normalize(),
    },
    uOceanLevel: { value: 0.02 },
  };
}