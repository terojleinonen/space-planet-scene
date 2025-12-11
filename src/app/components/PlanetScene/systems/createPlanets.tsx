// src/components/PlanetScene/systems/createPlanets.ts
import * as THREE from "three";
import {
  planetVertexShader,
  planetFragmentShader,
  createPlanetUniforms,
} from "../shaders/PlanetShader";

export type PlanetSystem = {
  orbitTargets: THREE.Vector3[];
  update: (time: number) => void;
  dispose: () => void;
};

export function createPlanets(
  solarSystem: THREE.Group,
  sunLight: THREE.PointLight
): PlanetSystem {
  const uniforms = createPlanetUniforms();

  const createPlanet = (radius: number, distance: number) => {
    const group = new THREE.Group();

    const geo = new THREE.SphereGeometry(radius, 64, 64);
    const mat = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.x = distance;
    group.add(mesh);
    solarSystem.add(group);

    return { group, mesh, geo, mat };
  };

  // Main planets (procedural surface)
  const planet1 = createPlanet(1, 0);
  const planet2 = createPlanet(0.55, 3.2);
  const planet3 = createPlanet(0.75, -4.5);
  const planet4 = createPlanet(0.4, 6.8);

  // Ringed planet
  const ringed = createPlanet(0.9, -9);

  const ringInner = 1.2;
  const ringOuter = 2.4;
  const ringSegments = 128;

  const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, ringSegments);
  const ringPos = ringGeo.attributes.position as THREE.BufferAttribute;
  const ringColors = new Float32Array(ringPos.count * 3);
  const ringColorInner = new THREE.Color(0x8f84d7);
  const ringColorOuter = new THREE.Color(0x1a1440);

  for (let i = 0; i < ringPos.count; i++) {
    const v = new THREE.Vector3(
      ringPos.getX(i),
      ringPos.getY(i),
      ringPos.getZ(i)
    );
    const dist = v.length();
    const tNorm = (dist - ringInner) / (ringOuter - ringInner);
    const c = ringColorInner.clone().lerp(ringColorOuter, tNorm);

    ringColors[i * 3 + 0] = c.r;
    ringColors[i * 3 + 1] = c.g;
    ringColors[i * 3 + 2] = c.b;
  }

  ringGeo.setAttribute("color", new THREE.Float32BufferAttribute(ringColors, 3));

  const ringMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = THREE.MathUtils.degToRad(72);
  ringMesh.rotation.z = THREE.MathUtils.degToRad(30);
  ringed.group.add(ringMesh);

  // Moon for planet1
  const moonGeo = new THREE.SphereGeometry(0.25, 32, 32);
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.95,
    metalness: 0.1,
  });
  const moon = new THREE.Mesh(moonGeo, moonMat);
  moon.position.x = 1.8;
  const moonOrbit = new THREE.Group();
  moonOrbit.add(moon);
  planet1.group.add(moonOrbit);

  const orbitTargets = [
    planet1.group.position.clone(),
    planet2.group.position.clone(),
    planet3.group.position.clone(),
  ];

  const update = (time: number) => {
    uniforms.uTime.value = time;

    // Rotations
    planet1.mesh.rotation.y += 0.003;
    planet2.mesh.rotation.y += 0.002;
    planet3.mesh.rotation.y += 0.0015;
    planet4.mesh.rotation.y += 0.0025;
    ringed.mesh.rotation.y += 0.0018;
    ringMesh.rotation.z += 0.00035;

    // Orbits
    planet2.group.rotation.y += 0.0008;
    planet3.group.rotation.y -= 0.0005;
    planet4.group.rotation.y += 0.0003;
    ringed.group.rotation.y += 0.00022;

    moonOrbit.rotation.y += 0.0045;
  };

  const dispose = () => {
    [planet1, planet2, planet3, planet4, ringed].forEach((p) => {
      p.geo.dispose();
      p.mat.dispose();
    });
    ringGeo.dispose();
    ringMat.dispose();
    moonGeo.dispose();
    moonMat.dispose();
  };

  return { orbitTargets, update, dispose };
}