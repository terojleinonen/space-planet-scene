import * as THREE from "three";

import {
  planetVertexShader,
  planetFragmentShader,
  createPlanetUniforms,
} from "../shaders/planetShader";

import {
  moonVertexShader,
  moonFragmentShader,
  createMoonUniforms,
} from "../shaders/moonShader";

import {
  atmosphereVertexShader,
  atmosphereFragmentShader,
  createAtmosphereUniforms,
} from "../shaders/atmosphereShader";

import {
  PlanetConfig,
  normalizePlanetConfig,
} from "../shaders/planetTypes";

/* ---------------------------------------------------------
   PLANET PRESETS (TYPE-SAFE)
--------------------------------------------------------- */

const EARTHLIKE: PlanetConfig = {
  elevationScale: 1.0,
  mountainSharpness: 1.0,
  oceanLevel: 0.02,
  biomeColorA: new THREE.Color(0x1b4d2a),
  biomeColorB: new THREE.Color(0x5b4a32),
  biomeColorC: new THREE.Color(0xffffff),
  iceThreshold: 0.65,
};

const DESERT: PlanetConfig = {
  elevationScale: 0.9,
  mountainSharpness: 0.7,
  oceanLevel: -0.2,
  biomeColorA: new THREE.Color(0xd6a55b),
  biomeColorB: new THREE.Color(0xa66b35),
  biomeColorC: new THREE.Color(0xf8e6b0),
  iceThreshold: 10.0,
};

const VOLCANIC: PlanetConfig = {
  elevationScale: 1.3,
  mountainSharpness: 2.0,
  oceanLevel: -0.3,
  biomeColorA: new THREE.Color(0x2a120c),
  biomeColorB: new THREE.Color(0x7a1b08),
  biomeColorC: new THREE.Color(0xff7b2a),
  iceThreshold: 5.0,
  lava: {
    lavaIntensity: 2.2,
    lavaThreshold: 0.45,
  },
};

const ICEWORLD: PlanetConfig = {
  elevationScale: 0.6,
  mountainSharpness: 0.7,
  oceanLevel: 0.25,
  biomeColorA: new THREE.Color(0x8fb4ff),
  biomeColorB: new THREE.Color(0xc5dcff),
  biomeColorC: new THREE.Color(0xffffff),
  iceThreshold: 0.3,
  sparkle: {
    sparkleIntensity: 1.8,
    sparkleSharpness: 28.0,
  },
};

/* ---------------------------------------------------------
   MAIN FACTORY
--------------------------------------------------------- */

export function createPlanets(
  solarSystem: THREE.Group,
  sunLight: THREE.PointLight
) {
  /* -------------------------------
     Helper
  -------------------------------- */

  const createPlanet = (
    radius: number,
    distance: number,
    config: PlanetConfig
  ) => {
    const normalized = normalizePlanetConfig(config);
    const uniforms = createPlanetUniforms(normalized);

    const material = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms,
      lights: false,
    });

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 64),
      material
    );
    mesh.position.x = distance;

    const group = new THREE.Group();
    group.add(mesh);
    solarSystem.add(group);

    return { group, mesh, uniforms };
  };

  /* -------------------------------
     Planets
  -------------------------------- */

  const p1 = createPlanet(1.0, 0.0, EARTHLIKE);
  const p2 = createPlanet(0.55, 3.2, DESERT);
  const p3 = createPlanet(0.75, -4.2, VOLCANIC);
  const p4 = createPlanet(0.42, 6.8, ICEWORLD);

  /* -------------------------------
     Atmosphere (Earthlike)
  -------------------------------- */

  const atmosphereUniforms = createAtmosphereUniforms();

  const atmosphereMat = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: atmosphereUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    lights: false,
  });

  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 64, 64),
    atmosphereMat
  );
  p1.group.add(atmosphereMesh);

  /* -------------------------------
     Moon
  -------------------------------- */

  const moonUniforms = createMoonUniforms() ;

  const moonMat = new THREE.ShaderMaterial({
    vertexShader: moonVertexShader,
    fragmentShader: moonFragmentShader,
    uniforms: moonUniforms,
    lights: false,
  });

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 48, 48),
    moonMat
  );
  moon.position.x = 1.8;

  const moonOrbit = new THREE.Group();
  moonOrbit.add(moon);
  p1.group.add(moonOrbit);

  /* -------------------------------
     Camera Targets
  -------------------------------- */

  const orbitTargets = [
    p1.group.position.clone(),
    p2.group.position.clone(),
    p3.group.position.clone(),
  ];

  /* -------------------------------
     Update Loop
  -------------------------------- */

  const update = (time: number) => {
    p1.uniforms.uTime.value = time;
    p2.uniforms.uTime.value = time;
    p3.uniforms.uTime.value = time;
    p4.uniforms.uTime.value = time;

    moonUniforms.uTime.value = time;

    p1.mesh.rotation.y += 0.003;
    p2.mesh.rotation.y += 0.002;
    p3.mesh.rotation.y += 0.0012;
    p4.mesh.rotation.y += 0.0018;

    moonOrbit.rotation.y += 0.004;

    atmosphereUniforms.uLightDir.value
      .copy(sunLight.position)
      .normalize();
  };

  /* -------------------------------
     Cleanup
  -------------------------------- */

  const dispose = () => {
    [p1, p2, p3, p4].forEach((p) => {
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });

    moon.geometry.dispose();
    (moon.material as THREE.Material).dispose();

    atmosphereMesh.geometry.dispose();
    atmosphereMat.dispose();
  };

  return { orbitTargets, update, dispose };
}