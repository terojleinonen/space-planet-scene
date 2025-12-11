// src/components/PlanetScene/shaders/nebulaShader.ts
export const nebulaVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const nebulaFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vWorldPos;

  uniform float uTime;
  uniform vec3 uCameraPos;
  uniform float uDensity;
  uniform int uPaletteMode;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));

    vec3 u = f * f * (3.0 - 2.0 * f);

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
    for (int i = 0; i < 6; i++) {
      sum += amp * noise(p * freq);
      freq *= 2.13;
      amp *= 0.5;
    }
    return sum;
  }

  float ridged(vec3 p) {
    float sum = 0.0;
    float freq = 1.0;
    float amp = 0.6;
    for(int i = 0; i < 4; i++){
      float n = noise(p * freq);
      n = 1.0 - abs(n * 2.0 - 1.0);
      sum += n * amp;
      freq *= 2.1;
      amp *= 0.5;
    }
    return sum;
  }

  bool intersectBox(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax, out float tNear, out float tFar) {
    vec3 t0 = (bmin - ro) / rd;
    vec3 t1 = (bmax - ro) / rd;

    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);

    tNear = max(max(tmin.x, tmin.y), tmin.z);
    tFar  = min(min(tmax.x, tmax.y), tmax.z);

    return tFar > max(tNear, 0.0);
  }

  vec3 paletteHubble(float d, float shape, float ridge) {
    vec3 teal = vec3(0.2, 0.8, 0.9);
    vec3 gold = vec3(1.0, 0.8, 0.3);
    vec3 green = vec3(0.6, 0.9, 0.5);

    float coolMix = smoothstep(0.2, 0.8, d);
    vec3 col = mix(gold, teal, coolMix);
    col = mix(col, green, 0.35);
    col *= (0.2 + shape * 0.8);
    col += ridge * 0.3;
    return col;
  }

  vec3 paletteJWST(float d, float shape, float ridge) {
    vec3 warmGold = vec3(1.1, 0.7, 0.35);
    vec3 ember    = vec3(1.0, 0.4, 0.2);
    vec3 coolDust = vec3(0.3, 0.6, 1.1);

    float hot = smoothstep(0.5, 1.0, d);
    vec3 col = mix(coolDust, warmGold, shape);
    col = mix(col, ember, hot);
    col += ridge * 0.35;
    return col;
  }

  void main() {
    vec3 boxMin = vec3(-20.0, -10.0, -20.0);
    vec3 boxMax = vec3( 20.0,  10.0,  20.0);

    vec3 ro = uCameraPos;
    vec3 rd = normalize(vWorldPos - uCameraPos);

    float tNear, tFar;
    if (!intersectBox(ro, rd, boxMin, boxMax, tNear, tFar)) {
      discard;
    }

    tNear = max(tNear, 0.0);

    float distanceInside = tFar - tNear;
    const int STEPS = 52;
    float stepSize = distanceInside / float(STEPS);

    vec3 accumColor = vec3(0.0);
    float accumAlpha = 0.0;

    float time = uTime * 0.25;

    for (int i = 0; i < STEPS; i++) {
      float t = tNear + float(i) * stepSize;
      vec3 pos = ro + rd * t;

      vec3 local = pos * 0.06;
      local += vec3(0.0, time * 0.35, time * 0.08);

      float base = fbm(local);
      float rNoise = ridged(local * 0.8);

      float radius = length((pos - vec3(0.0, 0.0, -5.0)) / vec3(16.0, 10.0, 16.0));
      float shape = smoothstep(1.0, 0.0, radius);

      float dust = fbm(local * 1.7);
      float dustMask = smoothstep(0.4, 0.9, dust);

      float density = base * shape * uDensity;
      density *= (1.0 - dustMask * 0.8);
      density *= (1.0 - accumAlpha);

      if (density < 0.001) continue;

      vec3 col;
      if (uPaletteMode == 0) {
        col = paletteHubble(base, shape, rNoise);
      } else {
        col = paletteJWST(base, shape, rNoise);
      }

      col = log(col * 1.5 + 1.0);
      col = pow(col, vec3(0.9));

      accumColor += col * density * 0.07;
      accumAlpha += density * 0.07;

      if (accumAlpha > 0.98) break;
    }

    accumAlpha = clamp(accumAlpha, 0.0, 1.0);

    vec3 bg = vec3(0.003, 0.003, 0.01);
    vec3 color = mix(bg, accumColor, accumAlpha);

    gl_FragColor = vec4(color, accumAlpha);
    if (gl_FragColor.a < 0.02) discard;
  }
`;