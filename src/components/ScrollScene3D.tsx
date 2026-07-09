'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const sectionSceneTargets = [
  { id: 'home', x: 2.65, y: 0.08, scale: 1.18 },
  { id: 'projects', x: -2.85, y: 0.02, scale: 1.12 },
  { id: 'experience', x: 2.75, y: -0.04, scale: 1.16 },
  { id: 'certificates', x: -2.55, y: 0.0, scale: 1.08 },
  { id: 'about', x: 2.35, y: 0.1, scale: 1.05 },
  { id: 'contact', x: -2.35, y: -0.08, scale: 1.04 },
  { id: 'comments', x: 2.2, y: 0.04, scale: 1.02 },
] as const;

type SectionSceneTarget = (typeof sectionSceneTargets)[number];


class InfinityCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const angle = t * Math.PI * 2;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const denominator = 1 + sin * sin;
    const scale = 1.45;

    const x = (scale * Math.SQRT2 * cos) / denominator;
    const y = (scale * Math.SQRT2 * cos * sin) / denominator;
    const z = Math.sin(angle * 2) * 0.18;

    return optionalTarget.set(x, y, z);
  }
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }

  material.dispose();
}

function getActiveSectionTarget(): SectionSceneTarget {
  const viewportCenter = window.scrollY + window.innerHeight * 0.52;
  let closestTarget: SectionSceneTarget = sectionSceneTargets[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const target of sectionSceneTargets) {
    const section = document.getElementById(target.id);
    if (!section) continue;

    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;

    if (viewportCenter >= top && viewportCenter < bottom) {
      return target;
    }

    const sectionCenter = top + section.offsetHeight / 2;
    const distance = Math.abs(sectionCenter - viewportCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestTarget = target;
    }
  }

  return closestTarget;
}

function getResponsiveSceneTarget(target: SectionSceneTarget) {
  const width = window.innerWidth;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const sideFactor = isMobile ? 0.22 : isTablet ? 0.58 : 1;
  const scaleFactor = isMobile ? 0.8 : isTablet ? 0.94 : 1;
  const sceneSizeFactor = 0.86;

  return {
    x: target.x * sideFactor,
    y: target.y + (isMobile ? -0.22 : 0),
    scale: target.scale * scaleFactor * sceneSizeFactor,
  };
}

export default function ScrollScene3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: process.env.NODE_ENV !== 'production',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.dataset.scrollSceneCanvas = 'true';
    container.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    const keyLight = new THREE.PointLight(0x8b5cf6, 3.6, 22);
    keyLight.position.set(3.5, 4.2, 6);
    const fillLight = new THREE.PointLight(0xc026d3, 2.4, 18);
    fillLight.position.set(-4, -2.5, 4.5);
    scene.add(ambientLight, keyLight, fillLight);

    const infinityGeometry = new THREE.TubeGeometry(new InfinityCurve(), 280, 0.14, 18, true);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x3b1368,
      emissiveIntensity: 0.82,
      metalness: 0.46,
      roughness: 0.22,
      transparent: true,
      opacity: 0.36,
    });
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xd946ef,
      wireframe: true,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const infinitySymbol = new THREE.Mesh(infinityGeometry, glassMaterial);
    const infinityWire = new THREE.Mesh(infinityGeometry, wireMaterial);
    root.add(infinitySymbol, infinityWire);

    const halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.25, 2),
      new THREE.MeshBasicMaterial({
        color: 0x7c3aed,
        wireframe: true,
        transparent: true,
        opacity: 0.13,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    halo.rotation.set(0.45, 0.2, -0.35);
    root.add(halo);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x9f5cff,
      transparent: true,
      opacity: 0.54,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const rings = [1.95, 2.5, 3.05, 3.55].map((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018, 8, 144), ringMaterial.clone());
      ring.rotation.x = Math.PI / 2 + index * 0.34;
      ring.rotation.y = index * 0.42;
      root.add(ring);
      return ring;
    });

    const particleCount = 320;
    const positions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const radius = 2.0 + Math.random() * 4.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[index * 3 + 2] = radius * Math.cos(phi);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc4b5fd,
      size: 0.034,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const scrollState = {
      current: 0,
      target: 0,
      velocity: 0,
      lastY: window.scrollY,
    };

    const sceneState = {
      x: 0,
      y: 0,
      scale: 1,
      targetX: 0,
      targetY: 0,
      targetScale: 1,
    };

    const updateScrollState = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const nextY = window.scrollY;
      const target = getResponsiveSceneTarget(getActiveSectionTarget());

      scrollState.target = clamp(nextY / maxScroll, 0, 1);
      scrollState.velocity = clamp((nextY - scrollState.lastY) / window.innerHeight, -1, 1);
      scrollState.lastY = nextY;

      sceneState.targetX = target.x;
      sceneState.targetY = target.y;
      sceneState.targetScale = target.scale;
    };

    const applyInitialScenePlacement = () => {
      updateScrollState();
      sceneState.x = sceneState.targetX;
      sceneState.y = sceneState.targetY;
      sceneState.scale = sceneState.targetScale;
      root.position.set(sceneState.x, sceneState.y, -1.1);
      root.scale.setScalar(sceneState.scale);
      particles.position.set(sceneState.x * 0.36, sceneState.y * 0.3, -2.35);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateScrollState();
    };

    let animationFrame = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new THREE.Clock();

    const render = () => {
      const elapsed = clock.getElapsedTime();
      scrollState.current += (scrollState.target - scrollState.current) * 0.075;
      scrollState.velocity *= 0.9;
      sceneState.x += (sceneState.targetX - sceneState.x) * 0.045;
      sceneState.y += (sceneState.targetY - sceneState.y) * 0.05;
      sceneState.scale += (sceneState.targetScale - sceneState.scale) * 0.055;

      const scroll = scrollState.current;
      const scrollEnergy = scrollState.velocity;
      const idleMotion = prefersReducedMotion ? 0 : elapsed;
      const driftX = Math.sin(idleMotion * 0.28) * 0.08;
      const driftY = Math.sin(scroll * Math.PI * 2) * 0.18 + Math.cos(idleMotion * 0.22) * 0.04;

      root.position.x = sceneState.x + driftX;
      root.position.y = sceneState.y + driftY;
      root.position.z = -1.08 + Math.sin(scroll * Math.PI) * 0.18;
      root.scale.setScalar(sceneState.scale + Math.abs(scrollEnergy) * 0.05);
      root.rotation.x = scroll * Math.PI * 0.86 + Math.sin(idleMotion * 0.36) * 0.1 + scrollEnergy * 0.28;
      root.rotation.y = scroll * Math.PI * 2.7 + idleMotion * 0.14 + scrollEnergy * 0.72;
      root.rotation.z = scroll * Math.PI * 0.55 + sceneState.x * 0.04;

      infinitySymbol.rotation.x = idleMotion * 0.1 + scroll * Math.PI;
      infinityWire.rotation.y = -idleMotion * 0.14 + scroll * Math.PI * 1.7;
      halo.rotation.x = idleMotion * 0.055 + scroll * Math.PI * 0.4;
      halo.rotation.y = idleMotion * 0.075 - scroll * Math.PI * 0.55;

      rings.forEach((ring, index) => {
        ring.rotation.z = scroll * Math.PI * (index + 1) * 0.72 + idleMotion * (0.1 + index * 0.028);
        ring.rotation.x = Math.PI / 2 + index * 0.34 + scrollEnergy * 0.18;
      });

      particles.position.x += (sceneState.x * 0.42 - particles.position.x) * 0.04;
      particles.position.y = sceneState.y * 0.35 + Math.sin(idleMotion * 0.32) * 0.12;
      particles.rotation.y = scroll * Math.PI * 1.65 + idleMotion * 0.045;
      particles.rotation.x = scroll * Math.PI * 0.3;

      camera.position.x = Math.sin(scroll * Math.PI * 2) * 0.25 + sceneState.x * 0.04;
      camera.position.y = Math.cos(scroll * Math.PI * 1.5) * 0.16;
      camera.lookAt(sceneState.x * 0.12, 0, 0);

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };

    applyInitialScenePlacement();
    render();

    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', handleResize);

      root.traverse((object) => {
        const mesh = object as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) disposeMaterial(mesh.material);
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-scroll-3d-scene="true"
      className="fixed inset-0 z-[1] pointer-events-none opacity-95 dark:opacity-100"
    />
  );
}
