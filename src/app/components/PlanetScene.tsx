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

export default function PlanetScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // -----------------------
    // Scene & Camera
    // -----------------------
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.035);

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 1.2, 6);

    // -----------------------
    // Renderer
    // -----------------------
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

    // -----------------------
    // Postprocessing Composer
    // -----------------------
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
      focusDistance: 0.015, // closer = nearer focus
      focalLength: 0.028,
      bokehScale: 3.0,
    });

    const chromaEffect = new ChromaticAberrationEffect({
    offset: new THREE.Vector2(0.0015, 0.0010),
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

    // -----------------------
    // Lights
    // -----------------------
    scene.add(new THREE.AmbientLight(0x6688ff, 0.35));

    const sunLight = new THREE.PointLight(0xffffff, 2.5, 80);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // -----------------------
    // Solar System Root
    // -----------------------
    const solarSystem = new THREE.Group();
    scene.add(solarSystem);

    // -----------------------
    // Planet Factory
    // -----------------------
    const createPlanet = (
      radius: number,
      color: number,
      emissive: number,
      distance: number
    ) => {
      const group = new THREE.Group();
      const geo = new THREE.SphereGeometry(radius, 64, 64);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.4,
        emissive,
        emissiveIntensity: 0.5,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = distance;
      group.add(mesh);

      return { group, mesh, geo, mat };
    };

    // -----------------------
    // Planets
    // -----------------------
    const planet1 = createPlanet(1, 0x223366, 0x111133, 0);
    const planet2 = createPlanet(0.55, 0x884422, 0x331100, 3.2);
    const planet3 = createPlanet(0.75, 0x224444, 0x112222, -4.5);
    const planet4 = createPlanet(0.4, 0x555555, 0x222222, 6.8);

    solarSystem.add(planet1.group);
    solarSystem.add(planet2.group);
    solarSystem.add(planet3.group);
    solarSystem.add(planet4.group);

    // -----------------------
    // Ringed Planet
    // -----------------------
    const ringed = createPlanet(0.9, 0x4c3f91, 0x221155, -9);
    solarSystem.add(ringed.group);

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

    // -----------------------
    // Moon for Planet1
    // -----------------------
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

    // -----------------------
    // Starfield
    // -----------------------
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3500;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 80 * (0.3 + Math.random());
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      starPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      starPositions[i * 3 + 2] = r * Math.cos(theta);
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);

    // -----------------------
    // SPACE DUST (near-camera particles)
    // -----------------------
    const dustGroup = new THREE.Group();
    scene.add(dustGroup);

    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 1800;
    const dustPositions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const r = 7 * Math.random();
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;

      dustPositions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      dustPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      dustPositions[i * 3 + 2] = r * Math.cos(theta);
    }

    dustGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(dustPositions, 3)
    );

    const dustMaterial = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const dust = new THREE.Points(dustGeometry, dustMaterial);
    dustGroup.add(dust);

    // -----------------------
    // Volumetric Haze Shell
    // -----------------------
    const hazeGeometry = new THREE.SphereGeometry(12, 32, 32);
    const hazeMaterial = new THREE.MeshBasicMaterial({
      color: 0x050818,
      transparent: true,
      opacity: 0.55,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const hazeShell = new THREE.Mesh(hazeGeometry, hazeMaterial);
    scene.add(hazeShell);

    // -----------------------
    // Volumetric Nebula (ray-marched box)
    // -----------------------
    const nebulaGeo = new THREE.BoxGeometry(40, 20, 40);

    const nebulaVertexShader = /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const nebulaFragmentShader = /* glsl */ `
      precision highp float;

      varying vec3 vWorldPos;

      uniform float uTime;
      uniform vec3 uCameraPos;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uDensity;

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
        for (int i = 0; i < 5; i++) {
          sum += amp * noise(p * freq);
          freq *= 2.03;
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
        const int STEPS = 42;
        float stepSize = distanceInside / float(STEPS);

        vec3 accumColor = vec3(0.0);
        float accumAlpha = 0.0;

        float time = uTime * 0.3;

        for (int i = 0; i < STEPS; i++) {
          float t = tNear + float(i) * stepSize;
          vec3 pos = ro + rd * t;

          vec3 local = pos * 0.07;
          local += vec3(0.0, time * 0.25, time * 0.05);

          float d = fbm(local);

          float radius = length((pos - vec3(0.0, 0.0, -5.0)) / vec3(16.0, 10.0, 16.0));
          float shape = smoothstep(1.0, 0.0, radius);

          float density = d * shape * uDensity;
          density *= (1.0 - accumAlpha);

          vec3 nebulaCol = mix(uColor1, uColor2, d);
          nebulaCol *= 0.7 + 0.3 * shape;

          accumColor += nebulaCol * density * 0.06;
          accumAlpha += density * 0.06;

          if (accumAlpha > 0.98) {
            break;
          }
        }

        accumAlpha = clamp(accumAlpha, 0.0, 1.0);

        vec3 bg = vec3(0.01, 0.01, 0.03);
        vec3 color = mix(bg, accumColor, accumAlpha);

        gl_FragColor = vec4(color, accumAlpha);
        if (gl_FragColor.a < 0.02) discard;
      }
    `;

    const nebulaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPos: { value: new THREE.Vector3() },
        uColor1: { value: new THREE.Color(0x4c1d95) }, // violet
        uColor2: { value: new THREE.Color(0x0f766e) }, // teal
        uDensity: { value: 0.85 },
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });

    const nebulaVolume = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaVolume.position.set(0, 0, -5);
    scene.add(nebulaVolume);

    // -----------------------
    // Hyperjump State
    // -----------------------
    let hyperPhase = 0;
    let hyperStartTime = 0;

    // -----------------------
    // Lightspeed Tunnel
    // -----------------------
    const tunnelGroup = new THREE.Group();
    scene.add(tunnelGroup);

    const tunnelSegments = 40;
    const tunnelRadius = 3.8;

    const tunnelGeo = new THREE.CylinderGeometry(
      tunnelRadius,
      tunnelRadius,
      80,
      32,
      tunnelSegments,
      true
    );

    const tunnelPos = tunnelGeo.attributes.position as THREE.BufferAttribute;
    const tunnelColors = new Float32Array(tunnelPos.count * 3);

    for (let i = 0; i < tunnelPos.count; i++) {
      const tNorm = i / tunnelPos.count;
      const c = new THREE.Color().setHSL(0.55 + tNorm * 0.1, 1, 0.5);
      tunnelColors[i * 3 + 0] = c.r;
      tunnelColors[i * 3 + 1] = c.g;
      tunnelColors[i * 3 + 2] = c.b;
    }

    tunnelGeo.setAttribute("color", new THREE.BufferAttribute(tunnelColors, 3));

    const tunnelMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnelGroup.add(tunnelMesh);
    tunnelGroup.visible = false;

    // -----------------------
    // White Flash Overlay
    // -----------------------
    const flashGeo = new THREE.PlaneGeometry(20, 20);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });

    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.set(0, 0, -3);
    camera.add(flashMesh);
    scene.add(camera);

    // -----------------------
    // CAMERA FLY-THROUGH
    // -----------------------
    const flyCamera = (t: number) => {
      const ease = (x: number) => x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
      const a = ease(Math.min(t / 10, 1));

      camera.position.x = THREE.MathUtils.lerp(0, 4.5, a);
      camera.position.y = THREE.MathUtils.lerp(1.2, 0.6, a);
      camera.position.z = THREE.MathUtils.lerp(6, 1.5, a);

      const targets = [
        planet1.group.position,
        planet2.group.position,
        planet3.group.position,
      ];

      const segment = Math.floor(a * (targets.length - 1));
      const next = Math.min(segment + 1, targets.length - 1);
      const localT = a * (targets.length - 1) - segment;

      const target = new THREE.Vector3().lerpVectors(
        targets[segment],
        targets[next],
        localT
      );

      camera.lookAt(target);
    };

    // -----------------------
    // ANIMATION LOOP
    // -----------------------
    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();

      // Planet rotations
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

      // Star / dust / haze
      starfield.rotation.y -= 0.0002;
      dustGroup.rotation.y += 0.0006;
      dustGroup.rotation.x += 0.0002;
      dustMaterial.opacity = 0.4 + Math.sin(t * 0.7) * 0.2;
      hazeShell.rotation.y += 0.00015;

      // Volumetric nebula motion
      nebulaVolume.rotation.y += 0.00015;
      nebulaMat.uniforms.uTime.value = t;
      (nebulaMat.uniforms.uCameraPos.value as THREE.Vector3).copy(
        camera.position
      );

      // Camera cinematic intro
      flyCamera(t);

      // -----------------------
      // HYPERJUMP TRIGGER
      // -----------------------
      if (t > 12 && hyperPhase === 0) {
        hyperPhase = 1;
        hyperStartTime = t;
        tunnelGroup.visible = true;
      }

      // -----------------------
      // HYPERJUMP ANIMATION
      // -----------------------
      if (hyperPhase === 1) {
        const dt = t - hyperStartTime;

        if (dt < 1) {
          camera.position.x += (Math.random() - 0.5) * 0.03;
          camera.position.y += (Math.random() - 0.5) * 0.02;
          starfield.scale.setScalar(1 - dt * 0.4);
        } else {
          hyperPhase = 2;
          hyperStartTime = t;
          tunnelMat.opacity = 1;
        }
      }

      if (hyperPhase === 2) {
        const dt = t - hyperStartTime;

        camera.position.z -= dt * 0.9;
        starfield.rotation.z += 0.04;
        tunnelGroup.position.z += dt * 5;
        flashMat.opacity = Math.min(1, 1.2 - dt * 0.8);

        if (dt > 2.5) {
          hyperPhase = 3;
          hyperStartTime = t;
          tunnelMat.opacity = 0;
        }
      }

      if (hyperPhase === 3) {
        const dt = t - hyperStartTime;

        starfield.scale.setScalar(0.6 + dt * 0.4);
        flashMat.opacity = Math.max(0, 1 - dt * 1.2);

        if (dt > 1.2) {
          hyperPhase = 0;

          camera.position.set(
            6 * (Math.random() - 0.5),
            2 + Math.random() * 1.5,
            6 + Math.random() * 3
          );
          camera.lookAt(0, 0, 0);

          solarSystem.position.set(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 10
          );

          tunnelGroup.visible = false;
        }
      }

      // Render via composer
      composer.render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // -----------------------
    // Resize
    // -----------------------
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // -----------------------
    // Cleanup
    // -----------------------
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      window.removeEventListener("resize", handleResize);

      container.removeChild(renderer.domElement);
      composerRef.current?.dispose();
      renderer.dispose();

      planet1.geo.dispose(); planet1.mat.dispose();
      planet2.geo.dispose(); planet2.mat.dispose();
      planet3.geo.dispose(); planet3.mat.dispose();
      planet4.geo.dispose(); planet4.mat.dispose();
      ringed.geo.dispose();  ringed.mat.dispose();

      ringGeo.dispose();
      ringMat.dispose();

      moonGeo.dispose();
      moonMat.dispose();

      starGeometry.dispose();
      starMaterial.dispose();

      dustGeometry.dispose();
      dustMaterial.dispose();

      hazeGeometry.dispose();
      hazeMaterial.dispose();

      tunnelGeo.dispose();
      tunnelMat.dispose();

      flashGeo.dispose();
      flashMat.dispose();

      nebulaGeo.dispose();
      nebulaMat.dispose();
    };
  }, []);

  return <div ref={containerRef} className="sceneRoot" />;
}