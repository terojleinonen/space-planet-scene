// src/components/PlanetScene/systems/createPlanets.ts
import * as THREE from "three";

import {
  planetVertexShader,
  planetFragmentShader,
  createPlanetUniforms,
  PlanetConfig,
} from "../shaders/planetShader";

import {
  moonVertexShader,
  moonFragmentShader,
  createMoonUniforms,
} from "../shaders/moonShader";

export function createPlanets(solarSystem: THREE.Group, sunLight: THREE.PointLight) {
  const EARTHLIKE: PlanetConfig = {
  elevationScale: 1.0,
  mountainSharpness: 1.0,
  oceanLevel: 0.02,
  biomeColorA: new THREE.Color(0x1b4d2a),    // darker green
  biomeColorB: new THREE.Color(0x5b4a32),    // brown/rock
  biomeColorC: new THREE.Color(0xffffff),    // ice/snow
  iceThreshold: 0.65,
  parallaxScale: 0.2,
};

const DESERT: PlanetConfig = {
  elevationScale: 0.9,
  mountainSharpness: 0.7,
  oceanLevel: -0.2,
  biomeColorA: new THREE.Color(0xd6a55b),
  biomeColorB: new THREE.Color(0xa66b35),
  biomeColorC: new THREE.Color(0xf8e6b0),
  iceThreshold: 10,
  parallaxScale: 0.2,
};

const VOLCANIC: PlanetConfig = {
  elevationScale: 1.3,
  mountainSharpness: 2.0,
  oceanLevel: -0.3,
  biomeColorA: new THREE.Color(0x2a120c),
  biomeColorB: new THREE.Color(0x7a1b08),
  biomeColorC: new THREE.Color(0xff7b2a),
  iceThreshold: 5.0,
  parallaxScale: 0.28,
  lavaIntensity: 2.2,     // 🔥 TURN LAVA ON
  lavaThreshold: 0.45,
};

const ICEWORLD: PlanetConfig = {
  elevationScale: 0.6,
  mountainSharpness: 0.7,
  oceanLevel: 0.25,
  biomeColorA: new THREE.Color(0x8fb4ff),
  biomeColorB: new THREE.Color(0xc5dcff),
  biomeColorC: new THREE.Color(0xffffff),
  iceThreshold: 0.3,
  parallaxScale: 0.12,
  sparkleIntensity: 1.8,  // ❄ TURN SPARKLE ON
  sparkleSharpness: 28.0,
};


  // CREATE PLANET HELPER
  const createPlanet = (radius: number, distance: number, config: PlanetConfig) => {
    const uniforms = createPlanetUniforms(config);

    const mat = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms,
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 64), mat);
    mesh.position.x = distance;

    const group = new THREE.Group();
    group.add(mesh);
    solarSystem.add(group);

    return { group, mesh, uniforms };
  };

  // MAIN PLANETS
  const p1 = createPlanet(1.0, 0, EARTHLIKE);
  const p2 = createPlanet(0.55, 3.2, DESERT);
  const p3 = createPlanet(0.75, -4.2, VOLCANIC);
  const p4 = createPlanet(0.42, 6.8, ICEWORLD);

  // MOON (special crater shader)
  const moonUniforms = createMoonUniforms();
  const moonMat = new THREE.ShaderMaterial({
    vertexShader: moonVertexShader,
    fragmentShader: moonFragmentShader,
    uniforms: moonUniforms,
  });

  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.25, 48, 48), moonMat);
  moon.position.x = 1.8;

  const moonOrbit = new THREE.Group();
  moonOrbit.add(moon);
  p1.group.add(moonOrbit);

  const orbitTargets = [
    p1.group.position.clone(),
    p2.group.position.clone(),
    p3.group.position.clone(),
  ];

  const update = (t: number) => {
    // update procedural time
    p1.uniforms.uTime.value = t;
    p2.uniforms.uTime.value = t;
    p3.uniforms.uTime.value = t;
    p4.uniforms.uTime.value = t;
    moonUniforms.uTime.value = t;

    // rotations
    p1.mesh.rotation.y += 0.003;
    p2.mesh.rotation.y += 0.002;
    p3.mesh.rotation.y += 0.0012;
    p4.mesh.rotation.y += 0.0018;

    moonOrbit.rotation.y += 0.004;
  };

  const dispose = () => {
    // Dispose planet materials, geometries
  };

  return { orbitTargets, update, dispose };
}