// src/components/PlanetScene/systems/createStars.ts
import * as THREE from "three";
import {
  starVertexShader,
  starFragmentShader,
} from "../shaders/starShader";

export type StarSystem = {
  group: THREE.Group;
  update: (time: number, camera: THREE.Camera) => void;
  dispose: () => void;
};

function randomStarColor() {
  const r = Math.random();
  if (r < 0.0000003) return new THREE.Color(0x9bb0ff);
  if (r < 0.0013) return new THREE.Color(0xaabfff);
  if (r < 0.0073) return new THREE.Color(0xcad7ff);
  if (r < 0.0373) return new THREE.Color(0xf8f7ff);
  if (r < 0.1133) return new THREE.Color(0xfff4e8);
  if (r < 0.2333) return new THREE.Color(0xffd2a1);
  return new THREE.Color(0xffa07a);
}

function galacticDensityFactor(v: THREE.Vector3) {
  const zNorm = v.z / 120;
  return Math.exp(-(zNorm * zNorm) / 0.25);
}

type StarLayer = {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
};

export function createStars(scene: THREE.Scene): StarSystem {
  const starUniforms = {
    uTime: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
  uniforms: starUniforms,
  vertexShader: starVertexShader,
  fragmentShader: starFragmentShader,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  lights: false,     
  }); 

  const group = new THREE.Group();
  scene.add(group);

  function generateLayer(
    count: number,
    radiusMin: number,
    radiusMax: number
  ): StarLayer {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const intensities = new Float32Array(count);

    let used = 0;

    for (let i = 0; i < count; i++) {
      const r = THREE.MathUtils.lerp(radiusMin, radiusMax, Math.random());
      const phi = Math.random() * Math.PI * 2;
      const costheta = THREE.MathUtils.lerp(-1, 1, Math.random());
      const theta = Math.acos(costheta);

      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * costheta;

      const p = new THREE.Vector3(x, y, z);
      const density = galacticDensityFactor(p);
      if (Math.random() > density) continue;

      const idx = used;

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      const c = randomStarColor();
      colors[idx * 3 + 0] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;

      sizes[idx] = THREE.MathUtils.randFloat(2.0, 10.0);
      intensities[idx] = THREE.MathUtils.randFloat(0.5, 1.4);

      used++;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions.subarray(0, used * 3), 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors.subarray(0, used * 3), 3)
    );
    geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(sizes.subarray(0, used), 1)
    );
    geometry.setAttribute(
      "aIntensity",
      new THREE.BufferAttribute(intensities.subarray(0, used), 1)
    );

    const points = new THREE.Points(geometry, material);
    return { points, geometry };
  }

  const nearLayer = generateLayer(300, 6, 14);
  const midLayer = generateLayer(800, 25, 80);
  const farLayer = generateLayer(1200, 120, 320);

  group.add(nearLayer.points);
  group.add(midLayer.points);
  group.add(farLayer.points);

  const update = (time: number, camera: THREE.Camera) => {
    starUniforms.uTime.value = time;

    const twinkleTime = time * 4.0;

    (nearLayer.points.material as THREE.ShaderMaterial).opacity =
      0.7 + Math.sin(twinkleTime + 1.3) * 0.1;
    (midLayer.points.material as THREE.ShaderMaterial).opacity =
      0.65 + Math.sin(twinkleTime * 0.7) * 0.07;
    (farLayer.points.material as THREE.ShaderMaterial).opacity =
      0.55 + Math.sin(twinkleTime * 0.4) * 0.05;

    group.position.x = camera.position.x * 0.02;
    group.position.y = camera.position.y * 0.02;
    group.position.z = camera.position.z * 0.02;
  };

  const dispose = () => {
    nearLayer.geometry.dispose();
    midLayer.geometry.dispose();
    farLayer.geometry.dispose();
    material.dispose();
  };

  return { group, update, dispose };
}