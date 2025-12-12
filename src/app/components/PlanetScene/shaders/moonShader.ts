import * as THREE from "three";

export const moonVertexShader = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;

  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const moonFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vPos;
  varying vec3 vNormal;

  uniform float uTime;
  uniform vec3 uLightDir;

  // ------------------------------------------------
  // HASH
  // ------------------------------------------------
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  // ------------------------------------------------
  // BASE NOISE
  // ------------------------------------------------
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

  // ------------------------------------------------
  // FBM LAYERS (dust & subtle height)
  // ------------------------------------------------
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

  // ------------------------------------------------
  // CRATER FUNCTION
  // ------------------------------------------------
  float crater(vec3 p) {
    // Large-scale crater zones
    float base = fbm(p * 5.0);

    // Noise warp
    float warp = noise(p * 12.0);

    // Crater shape — inverted ridged noise
    float c = 1.0 - abs(noise(p * 15.0) * 2.0 - 1.0);
    c = pow(c, 4.0);   // sharper rims

    // Combine
    return base * 0.3 + c * 1.2 + warp * 0.2;
  }

  // ------------------------------------------------
  // MAIN
  // ------------------------------------------------
  void main() {
    vec3 p = normalize(vPos);

    float cr = crater(p);
    float dust = fbm(p * 2.0) * 0.25;

    float height = cr + dust * 0.4;

    // Color palette (moon greys)
    vec3 c1 = vec3(0.62);
    vec3 c2 = vec3(0.45);
    vec3 c3 = vec3(0.22);

    vec3 col = mix(c1, c2, height);
    col = mix(col, c3, smoothstep(0.6, 1.0, height));

    // Lighting
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);

    float diff = max(dot(N, L), 0.0);

    // Backscatter for the far side glow
    float back = pow(max(dot(N, -L), 0.0), 3.0);

    col = col * (0.15 + diff * 0.85) + back * 0.2;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createMoonUniforms() {
  return {
    uTime: { value: 0 },
    uLightDir: { value: new THREE.Vector3(1, 0.4, 0.2).normalize() },
  };
}