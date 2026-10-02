import type { WebGLRenderer } from "three";

/** Mobile-only GPU settings. Keep scene composition and desktop settings intact. */
export const MOBILE_CONFIG = Object.freeze({
  mediaQuery: "(max-width: 768px)",
  userAgentFallback: /Android|iPhone|iPad|iPod|Mobile/i,
  maxPixelRatio: 1.5,
  targetFps: 30,
  sphereWidthSegments: 32,
  sphereHeightSegments: 32,
  lowMemoryGiB: 2,
});

export function isMobile3DDevice() {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia(MOBILE_CONFIG.mediaQuery).matches;
  } catch {
    return MOBILE_CONFIG.userAgentFallback.test(navigator.userAgent);
  }
}

export function configureMobileRenderer(renderer: WebGLRenderer, desktopPixelRatio: number) {
  const mobile = isMobile3DDevice();
  renderer.setPixelRatio(mobile
    ? Math.min(window.devicePixelRatio || 1, MOBILE_CONFIG.maxPixelRatio)
    : Math.min(window.devicePixelRatio || 1, desktopPixelRatio));
  return mobile;
}

export function canRenderFrame(now: number, lastFrame: number, mobile: boolean) {
  return !mobile || now - lastFrame >= 1000 / MOBILE_CONFIG.targetFps;
}

export function lowMemoryDevice() {
  return isMobile3DDevice()
    && "deviceMemory" in navigator
    && (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined
    && (navigator as Navigator & { deviceMemory: number }).deviceMemory <= MOBILE_CONFIG.lowMemoryGiB;
}

export function handleContextLoss(renderer: WebGLRenderer, onRepeatedLoss?: () => void) {
  let losses = 0;
  const canvas = renderer.domElement;
  const onLost = (event: Event) => {
    event.preventDefault();
    losses += 1;
    if (losses >= 2) onRepeatedLoss?.();
  };
  const onRestored = () => renderer.resetState();
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  return () => {
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
  };
}
