import * as THREE from "three";

export function createAtmosphereUniforms() {
  return {
    uLightDir: { value: new THREE.Vector3(1, 0.4, 0.2).normalize() },
    uColor: { value: new THREE.Color(0x5ab8ff) },
    uIntensity: { value: 1.25 },
  };
}

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position =
      projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vPos;

  uniform vec3 uLightDir;
  uniform vec3 uColor;
  uniform float uIntensity;

  void main() {
    vec3 p = normalize(vPos);

    // rim lighting (strong at horizon)
    float rim = 1.0 - abs(p.y);
    rim = pow(rim, 3.0);

    // front light contribution
    float light = max(dot(p, normalize(uLightDir)), 0.0);

    float glow = rim * 0.85 + light * 0.15;

    vec3 col = uColor * glow * uIntensity;

    gl_FragColor = vec4(col, glow * 0.6);
  }
`;