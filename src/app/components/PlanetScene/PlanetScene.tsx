"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  DepthOfFieldEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
} from "postprocessing";

import { createPlanets } from "./systems/createPlanets";
import { createNebula } from "./systems/createNebula";
import { createStars } from "./systems/createStars";
import { createDust } from "./systems/createDust";
import { createHyperjumpController } from "./systems/hyperjump";
import { createCameraFlyController } from "./systems/cameraFly";

export default function PlanetScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.035);

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 1.2, 6);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Postprocessing
    const composer = new EffectComposer(renderer);
    composer.setSize(width, height);
    composerRef.current = composer;

    const renderPass = new RenderPass(scene, camera);

    const bloomEffect = new BloomEffect({
      intensity: 1.2,
      luminanceThreshold: 0.25,
      luminanceSmoothing: 0.9,
    });

    const dofEffect = new DepthOfFieldEffect(camera, {
      focusDistance: 0.015,
      focalLength: 0.028,
      bokehScale: 3.0,
    });

    const chromaEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0015, 0.001),
      radialModulation: true,
      modulationOffset: 0.5,
    });

    const vignetteEffect = new VignetteEffect({
      eskil: false,
      offset: 0.25,
      darkness: 0.7,
    });

    const effectPass = new EffectPass(
      camera,
      bloomEffect,
      dofEffect,
      chromaEffect,
      vignetteEffect
    );

    composer.addPass(renderPass);
    composer.addPass(effectPass);

    // Lights
    scene.add(new THREE.AmbientLight(0x6688ff, 0.35));
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 80);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Solar system root
    const solarSystem = new THREE.Group();
    scene.add(solarSystem);

    // Systems
    const planets = createPlanets(solarSystem, sunLight);
    const stars = createStars(scene);
    const dust = createDust(scene);
    const nebula = createNebula(scene);

    // Hyperjump controller (creates tunnel + flash)
    const hyperjump = createHyperjumpController({
      scene,
      camera,
      solarSystem,
      starfieldGroup: stars.group,
    });

    // Camera fly-through controller
    const cameraFly = createCameraFlyController({
      camera,
      planetTargets: planets.orbitTargets,
    });

    // Palette toggle (Hubble / JWST) for nebula
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "h" || e.key === "H") nebula.setPaletteMode(0); // Hubble
      if (e.key === "j" || e.key === "J") nebula.setPaletteMode(1); // JWST
    };
    window.addEventListener("keydown", keyHandler);

    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();

      planets.update(t);
      stars.update(t, camera);
      dust.update(t);
      nebula.update(t, camera);
      cameraFly.update(t);
      hyperjump.update(t); // now smooth & less jumpy

      composer.render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", keyHandler);

      container.removeChild(renderer.domElement);
      composerRef.current?.dispose();
      renderer.dispose();

      planets.dispose();
      stars.dispose();
      dust.dispose();
      nebula.dispose();
      hyperjump.dispose();
    };
  }, []);

  return <div ref={containerRef} className="sceneRoot" />;
}