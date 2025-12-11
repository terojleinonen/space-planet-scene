// src/components/PlanetScene/shaders/starShader.ts
export const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aIntensity;
  varying vec3 vColor;
  varying float vIntensity;

  void main() {
    vColor = color;
    vIntensity = aIntensity;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = length(mvPosition.xyz);
    float size = aSize * (50.0 / dist);
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const starFragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vIntensity;

  void main() {
    vec2 uv = gl_PointCoord.xy;
    vec2 centered = uv * 2.0 - 1.0;
    float r = length(centered);

    float core = exp(-r * r * 12.0);
    float angle = atan(centered.y, centered.x);
    float spikes = pow(abs(cos(angle * 4.0)), 40.0);
    float spikeMask = smoothstep(0.6, 0.1, r);
    float spike = spikes * spikeMask;
    float halo = exp(-r * 6.0) * 0.4;

    float brightness = (core + spike + halo) * vIntensity;

    vec3 col = vColor * brightness;
    float alpha = clamp(brightness, 0.0, 1.0);
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;