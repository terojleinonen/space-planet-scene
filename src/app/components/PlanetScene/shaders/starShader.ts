export const starVertexShader = /* glsl */ `
  attribute vec3 color;      // ✅ REQUIRED
  attribute float aSize;
  attribute float aIntensity;

  varying vec3 vColor;
  varying float vIntensity;

  void main() {
    vColor = color;
    vIntensity = aIntensity;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const starFragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vIntensity;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5,0.0,d);
    gl_FragColor = vec4(vColor * vIntensity, a);
  }
`;