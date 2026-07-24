import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import type { Theme } from "../ThemeToggle";
import { SECTIONS } from "../sections";

const ROAD_TEXTURE_URL =
  "/c69e6031556efc5df8605c54d2f4c628-removebg-preview.png";
const CAR_MODEL_URL = "/scene.gltf";

// Evenly spaced stops down the road, with a margin so the first/last don't
// sit flush against the sidebar's top/bottom edge.
const STOP_MARGIN = 0.1;
const STOP_FRACTIONS = SECTIONS.map(
  (_, i) => STOP_MARGIN + (i * (1 - 2 * STOP_MARGIN)) / (SECTIONS.length - 1),
);

export const SIDEBAR_WIDTH = 200;
const ROAD_CANVAS_WIDTH = 72;

// The orthographic camera always shows exactly this many world units of
// road height, regardless of window size -- frac 0 is the top of that
// span, frac 1 is the bottom, matching STOP_FRACTIONS 1:1.
const ROAD_LENGTH = 10;
const ROAD_WIDTH = 0.55;
const ROAD_REPEATS = 5; // static tiling, just enough dashes to fill the strip

// Small on purpose -- this is a navbar marker, not a hero render.
const CAR_SCALE = 0.16;

function worldZFor(frac: number): number {
  return -ROAD_LENGTH / 2 + frac * ROAD_LENGTH;
}

// Draws a soft radial falloff (no external asset needed) used as a cheap
// stand-in for a cast shadow under the car.
function createShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.55)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

interface DriveSceneProps {
  theme: Theme;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}

export default function DriveScene({
  theme,
  activeIndex,
  onActiveIndexChange,
}: DriveSceneProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<THREE.Object3D | null>(null);

  // The GLTF (14MB+ of geometry/textures) can still be loading when a click
  // changes activeIndex, so the tween effect below may fire while carRef is
  // still null and silently no-op. Mirroring activeIndex into a ref lets the
  // load callback (created once, in a stale closure) always read the
  // *current* selection instead of whatever it was when the effect first ran.
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const isDark = theme === "dark";

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // THREE.WebGLRenderer's constructor throws (rather than returning null)
    // when the browser/environment can't provide a WebGL context at all --
    // guard so that case degrades gracefully instead of crashing the tree.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.warn("DriveScene: WebGL unavailable, skipping 3D scene", err);
      return;
    }

    const scene = new THREE.Scene();

    // A true top-down camera: position directly above, then rotate -90
    // degrees about X to look straight down. Using rotation instead of
    // lookAt() avoids the gimbal-lock ambiguity of looking straight down
    // the same axis as the "up" vector.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(0, 10, 0);
    camera.rotation.x = -Math.PI / 2;

    function updateFrustum() {
      if (!container) return;
      const aspect = container.clientWidth / container.clientHeight;
      const viewWidth = ROAD_LENGTH * aspect;
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = ROAD_LENGTH / 2;
      camera.bottom = -ROAD_LENGTH / 2;
      camera.updateProjectionMatrix();
    }
    updateFrustum();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lit mostly by soft ambient light, with a dim directional light offset
    // well away from vertical. A light placed near-overhead (matching this
    // top-down camera) would bounce straight off the car's glossy clearcoat
    // paint right back into the lens, blowing out into a bright halo.
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
    // Offset toward +X so the soft blob shadow falls toward -X (left of car).
    keyLight.position.set(4, 5, 6);
    scene.add(ambientLight, keyLight);

    const textureLoader = new THREE.TextureLoader();
    const roadTexture = textureLoader.load(ROAD_TEXTURE_URL);
    roadTexture.colorSpace = THREE.SRGBColorSpace;
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(1, ROAD_REPEATS);

    const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH);
    const roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTexture,
      transparent: true,
      roughness: 1,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // Soft blob standing in for the car's cast shadow, nudged toward -X
    // (lit from the upper right) and synced to the car every frame.
    const shadowTexture = createShadowTexture();
    const shadowGeometry = new THREE.PlaneGeometry(0.24, 0.4);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.visible = false;
    scene.add(shadow);

    // React 18 StrictMode double-invokes this effect in dev (mount, cleanup,
    // mount again). Without this guard, a first-mount's GLTF fetch can
    // resolve *after* its own cleanup already ran, and would otherwise still
    // overwrite carRef with a car object living in an orphaned, unrendered
    // scene -- leaving the actually-visible car (from the second mount)
    // permanently untouched by later tweens.
    let cancelled = false;
    let car: THREE.Object3D | null = null;

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(CAR_MODEL_URL, (gltf) => {
      if (cancelled) return;
      car = gltf.scene;

      // The model ships with its own studio-style ground disc ("Plane_0",
      // using the "asphalt" material) -- we already have our own road
      // plane, so hide the model's copy to avoid a double-ground look.
      const modelGround = car.getObjectByName("Plane_0");
      if (modelGround) modelGround.visible = false;

      // Tame the body paint's clearcoat -- at full strength it acts like a
      // mirror and, combined with the top-down camera, creates a blown-out
      // highlight rather than reading as glossy orange paint.
      car.traverse((node) => {
        if (
          node instanceof THREE.Mesh &&
          node.material instanceof THREE.MeshPhysicalMaterial &&
          node.material.clearcoat > 0
        ) {
          node.material.clearcoat = 0.35;
          node.material.clearcoatRoughness = 0.3;
        }
      });

      car.scale.setScalar(CAR_SCALE);
      // Rotates the model so its hood/badge face up the road (away from
      // camera), matching the model's default front-facing orientation.
      car.rotation.y = Math.PI;
      car.position.set(0, 0, worldZFor(STOP_FRACTIONS[activeIndexRef.current]));
      scene.add(car);
      carRef.current = car;
      shadow.visible = true;
    });

    let frameId = 0;
    function renderFrame() {
      if (car) {
        shadow.position.set(
          car.position.x - 0.05,
          0.001,
          car.position.z + 0.03,
        );
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderFrame);
    }
    renderFrame();

    function handleResize() {
      if (!container) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
      updateFrustum();
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);

      roadGeometry.dispose();
      roadMaterial.dispose();
      roadTexture.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      carRef.current?.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];
          for (const material of materials) {
            material.dispose();
          }
        }
      });
      carRef.current = null;

      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Drives the car to whichever stop is active, independent of the mount
  // effect above so clicking a nav item doesn't tear down/rebuild the scene.
  useEffect(() => {
    const car = carRef.current;
    if (!car) return;
    gsap.to(car.position, {
      z: worldZFor(STOP_FRACTIONS[activeIndex]),
      duration: 0.8,
      ease: "power2.inOut",
    });
  }, [activeIndex]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        // Dark: left:0. Light: left pinned to the right edge via calc -- both
        // are numeric so the browser can actually tween the slide (unlike
        // left:auto, which CSS can't interpolate).
        left: isDark ? 0 : `calc(100vw - ${SIDEBAR_WIDTH}px)`,
        width: SIDEBAR_WIDTH,
        height: "100vh",
        display: "flex",
        // Mirror the road/labels order on the right so the road stays on the
        // outer edge of the screen in both themes.
        flexDirection: isDark ? "row" : "row-reverse",
        background: "var(--sidebar-bg)",
        borderRight: isDark ? "1px solid var(--sidebar-border)" : "none",
        borderLeft: isDark ? "none" : "1px solid var(--sidebar-border)",
        zIndex: 20,
        transition:
          "left 0.8s ease, background-color 0.8s ease, border-color 0.8s ease",
      }}
    >
      <div
        ref={canvasContainerRef}
        style={{ width: ROAD_CANVAS_WIDTH, height: "100%", flexShrink: 0 }}
      />
      <nav style={{ position: "relative", flex: 1 }}>
        {SECTIONS.map((section, i) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onActiveIndexChange(i)}
            style={{
              position: "absolute",
              top: `${STOP_FRACTIONS[i] * 100}%`,
              left: isDark ? 0 : "auto",
              right: isDark ? "auto" : 0,
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              padding: isDark ? "4px 8px 4px 4px" : "4px 4px 4px 8px",
              fontFamily: "monospace",
              fontSize: "0.8rem",
              cursor: "pointer",
              color: i === activeIndex ? "var(--accent)" : "var(--muted)",
              textAlign: isDark ? "left" : "right",
              transition: "color 0.2s",
            }}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
