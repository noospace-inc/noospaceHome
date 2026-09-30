"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ASTEROID_POSITIONS = [
  { top: 80, left: 9, size: 30 },
  { top: 64, left: 22, size: 28 },
  { top: 62, left: 91, size: 34 },
   { top: 32, left: 81, size: 34 },
];

// How long the "touched" spin-and-vanish animation takes, in seconds.
const VANISH_DURATION = 0.9;
// Pointer movement (px) below which a press+release counts as a "touch" (tap)
// rather than a drag.
const TAP_MOVE_THRESHOLD = 6;

type Asteroid = {
  object: THREE.Object3D;
  left: number;
  top: number;
  size: number;
  phase: number;
  baseX: number;
  baseY: number;
  materials: THREE.Material[];
  vanishing: boolean;
  vanishElapsed: number;
  vanishStartRotationY: number;
  vanishStartScale: number;
  removed: boolean;
};

export default function AsteroidField({ enabled, onReady }: { enabled: boolean; onReady: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    let disposed = false;
    let frame = 0;
    let width = 1;
    let height = 1;
    let worldWidth = 1;
    let worldHeight = 1;
    let modelScale = 1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "block h-full w-full";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xd8c9ff, 2.1));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-4, 7, 10);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x9a6cff, 18, 40);
    rimLight.position.set(5, -2, 5);
    scene.add(rimLight);

    const asteroids: Asteroid[] = [];
    let draggedAsteroid: Asteroid | null = null;
    let activePointerId: number | null = null;
    let pointerDownX = 0;
    let pointerDownY = 0;
    let pointerMoved = false;
    const dragOffset = new THREE.Vector3();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const dragPosition = new THREE.Vector3();
    const projectedCenter = new THREE.Vector3();

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      worldHeight =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      worldWidth = worldHeight * camera.aspect;

      asteroids.forEach((asteroid) => {
        if (asteroid.vanishing || asteroid.removed) return;
        asteroid.object.position.set(
          (asteroid.left / 100 - 0.5) * worldWidth,
          (0.5 - asteroid.top / 100) * worldHeight,
          0,
        );
        asteroid.baseX = asteroid.object.position.x;
        asteroid.baseY = asteroid.object.position.y;
        const sizeInWorld = (asteroid.size * worldHeight * 1.5) / height;
        asteroid.object.scale.setScalar(sizeInWorld * modelScale);
      });
    };

    const findAsteroidAt = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) return undefined;
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);

      let asteroid: Asteroid | undefined;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const candidate of asteroids) {
        if (candidate.vanishing || candidate.removed) continue;
        candidate.object.getWorldPosition(projectedCenter).project(camera);
        const centerX = rect.left + ((projectedCenter.x + 1) / 2) * rect.width;
        const centerY = rect.top + ((1 - projectedCenter.y) / 2) * rect.height;
        const distance = Math.hypot(clientX - centerX, clientY - centerY);
        const hitRadius = Math.max(42, candidate.size * 1.5);

        if (distance < hitRadius && distance < closestDistance) {
          asteroid = candidate;
          closestDistance = distance;
        }
      }

      return asteroid;
    };

    const startVanish = (asteroid: Asteroid) => {
      if (asteroid.vanishing || asteroid.removed) return;
      asteroid.vanishing = true;
      asteroid.vanishElapsed = 0;
      asteroid.vanishStartRotationY = asteroid.object.rotation.y;
      asteroid.vanishStartScale = asteroid.object.scale.x;
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) return;

      pointerDownX = event.clientX;
      pointerDownY = event.clientY;
      pointerMoved = false;

      const asteroid = findAsteroidAt(event.clientX, event.clientY);
      console.log(
        "[AsteroidField] pointerdown at",
        event.clientX,
        event.clientY,
        "| asteroids loaded:",
        asteroids.length,
        "| hit:",
        !!asteroid,
      );
      if (!asteroid) return;

      raycaster.setFromCamera(pointer, camera);
      if (asteroid && raycaster.ray.intersectPlane(dragPlane, dragPosition)) {
        draggedAsteroid = asteroid;
        activePointerId = event.pointerId;
        dragOffset.set(
          asteroid.baseX - dragPosition.x,
          asteroid.baseY - dragPosition.y,
          0,
        );
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return;
      const rect = container.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) return;
      if (Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY) > TAP_MOVE_THRESHOLD) {
        pointerMoved = true;
      }
      if (!draggedAsteroid || draggedAsteroid.vanishing) return;
      event.preventDefault();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(dragPlane, dragPosition)) {
        const halfSize = (draggedAsteroid.size * worldHeight * 0.75) / height;
        draggedAsteroid.baseX = THREE.MathUtils.clamp(
          dragPosition.x + dragOffset.x,
          -worldWidth / 2 + halfSize,
          worldWidth / 2 - halfSize,
        );
        draggedAsteroid.baseY = THREE.MathUtils.clamp(
          dragPosition.y + dragOffset.y,
          -worldHeight / 2 + halfSize,
          worldHeight / 2 - halfSize,
        );
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return;

      // A press+release with little movement counts as a "touch": spin once
      // and vanish instead of (or after) dragging.
      if (!pointerMoved && draggedAsteroid) {
        startVanish(draggedAsteroid);
      }

      draggedAsteroid = null;
      activePointerId = null;
    };

    const loader = new GLTFLoader();
    loader.load(
      "/3dasset/asteroid.glb",
      (gltf) => {
      if (disposed) return;
      console.log("[AsteroidField] model loaded successfully");

      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
      modelScale = 1 / maxDimension;
      model.position.sub(center);
      model.scale.setScalar(modelScale);

      ASTEROID_POSITIONS.forEach((position, index) => {
        const object = model.clone(true);
        object.rotation.set(index * 0.8, index * 1.1, index * 0.45);
        scene.add(object);

        // Give this instance its own material copies so fading it out on
        // vanish doesn't affect the other asteroids sharing the same model.
        const materials: THREE.Material[] = [];
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const cloneMaterial = (mat: THREE.Material) => {
              const cloned = mat.clone();
              cloned.transparent = true;
              materials.push(cloned);
              return cloned;
            };
            child.material = Array.isArray(child.material)
              ? child.material.map(cloneMaterial)
              : cloneMaterial(child.material);
          }
        });

        asteroids.push({
          ...position,
          object,
          phase: index * 1.3,
          baseX: 0,
          baseY: 0,
          materials,
          vanishing: false,
          vanishElapsed: 0,
          vanishStartRotationY: 0,
          vanishStartScale: 1,
          removed: false,
        });
      });

      resize();
      onReady();
      },
      undefined,
      (error) => {
        console.error("[AsteroidField] FAILED to load /3dasset/asteroid.glb", error);
        onReady();
      },
    );

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    const clock = new THREE.Clock();
    let elapsed = 0;
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      elapsed += delta;

      let needsCleanup = false;

      asteroids.forEach((asteroid) => {
        if (asteroid.removed) return;
        const { object, phase, baseY } = asteroid;

        if (asteroid.vanishing) {
          asteroid.vanishElapsed += delta;
          const t = Math.min(asteroid.vanishElapsed / VANISH_DURATION, 1);
          const eased = t * t * (3 - 2 * t); // smoothstep

          object.rotation.y = asteroid.vanishStartRotationY + eased * Math.PI * 2;
          const scale = asteroid.vanishStartScale * (1 - eased);
          object.scale.setScalar(Math.max(scale, 0));
          asteroid.materials.forEach((material) => {
            material.opacity = 1 - eased;
          });

          if (t >= 1) {
            asteroid.removed = true;
            scene.remove(object);
            needsCleanup = true;
          }
          return;
        }

        object.rotation.y += delta * 0.08;
        object.position.y = baseY + (Math.sin(elapsed * 0.8 + phase) * 5 * worldHeight) / height;
      });

      if (needsCleanup) {
        for (let i = asteroids.length - 1; i >= 0; i -= 1) {
          if (asteroids[i].removed) asteroids.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      observer.disconnect();
      asteroids.forEach(({ object }) => scene.remove(object));
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [enabled, onReady]);

  return <div ref={containerRef} aria-hidden="true" className="hero-asteroid-field pointer-events-none absolute inset-0" style={{ zIndex: 4, animation: "hero-rise 1.2s cubic-bezier(0.2, 0.75, 0.25, 1) 0.5s both" }} />;
}

