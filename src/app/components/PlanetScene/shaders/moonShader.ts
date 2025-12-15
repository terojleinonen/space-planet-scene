import * as THREE from "three";

export function createMoonUniforms() {
  return {
    uTime: { value: 0 },
    uLightDir: { value: new THREE.Vector3(1, 0.4, 0.2).normalize() },
  };
}

export const moonVertexShader = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position =
      projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;

export const moonFragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  uniform vec3 uLightDir;

  void main() {
    float d = dot(normalize(vNormal), normalize(uLightDir));
    float shade = clamp(d * 0.8 + 0.2, 0.0, 1.0);
    gl_FragColor = vec4(vec3(0.5) * shade, 1.0);
  }
`;