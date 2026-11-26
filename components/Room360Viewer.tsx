'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import { useLanguage } from '@/components/LanguageProvider';

const xrStore = createXRStore();

interface Room360ViewerProps {
  imageUrl: string;
  isWatermarked: boolean;
  onUnlockClick: () => void;
}

function PanoramaDome({ imageUrl }: { imageUrl: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setTexture(null);
      return;
    }

    let disposed = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (disposed) return;
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.src = imageUrl;

    return () => {
      disposed = true;
    };
  }, [imageUrl]);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[10, 64, 48]} />
      {texture ? (
        <meshBasicMaterial key="loaded" map={texture} side={THREE.DoubleSide} />
      ) : (
        <meshBasicMaterial key="loading" color="#18181b" side={THREE.DoubleSide} />
      )}
    </mesh>
  );
}

function FovController({ fov }: { fov: number }) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  return null;
}

export default function Room360Viewer({
  imageUrl,
  isWatermarked,
  onUnlockClick,
}: Room360ViewerProps) {
  const { locale } = useLanguage();
  const [fov, setFov] = useState(75);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchDistRef = useRef<number | null>(null);

  const clampFov = (val: number) => Math.min(100, Math.max(28, val));

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setFov((prev) => clampFov(prev + (e.deltaY > 0 ? 5 : -5)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (pinchDistRef.current !== null) {
        const diff = pinchDistRef.current - dist;
        setFov((prev) => clampFov(prev + diff * 0.2));
      }
      pinchDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    pinchDistRef.current = null;
  };

  const zoomPercent = Math.round(((100 - fov) / (100 - 28)) * 100);

  const touchHint =
    locale === 'ko'
      ? '👆 드래그 360° 회전 · 휠/핀치로 확대·축소'
      : locale === 'ja'
      ? '👆 ドラッグ360°回転 · ホイール/ピンチで拡大縮小'
      : locale === 'es'
      ? '👆 Arrastra 360° · Rueda/Pellizco para zoom'
      : locale === 'zh'
      ? '👆 拖动 360° 环顾 · 滚轮/双指缩放'
      : '👆 Drag 360° · Wheel/Pinch to Zoom';

  const vrBtn =
    locale === 'ko'
      ? 'VR 헤드셋'
      : locale === 'ja'
      ? 'VRモード'
      : locale === 'es'
      ? 'Modo VR'
      : locale === 'zh'
      ? 'VR 模式'
      : 'VR Mode';

  const freeBannerText =
    locale === 'ko'
      ? '무료 360° 미리보기 · 고화질 원본 텍스처는 HD 팩으로 잠금 해제하세요'
      : 'Free 360° Preview · Unlock HD Pack for crisp full-res textures';

  const unlockBtn = locale === 'ko' ? 'HD 잠금 해제 ($10.90)' : 'Unlock HD ($10.90)';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[460px] sm:h-[540px] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950 select-none touch-none"
    >
      {/* 상단 조작 가이드 & 줌/VR 컨트롤 */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-zinc-950/75 backdrop-blur-md text-zinc-100 px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border border-white/10">
          {touchHint}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <div className="inline-flex items-center bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-xl p-0.5 text-white text-xs font-bold">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setFov((f) => clampFov(f + 10))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 cursor-pointer"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setFov(75)}
              className="px-2 h-7 text-[11px] text-zinc-300 hover:text-white cursor-pointer"
              title="Reset zoom"
            >
              {zoomPercent}%
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setFov((f) => clampFov(f - 10))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => xrStore.enterVR()}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold shadow-md transition cursor-pointer"
          >
            {vrBtn}
          </button>
        </div>
      </div>

      {/* 무료 체험 워터마크 오버레이 */}
      {isWatermarked && (
        <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/85 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl">
          <span className="text-xs text-zinc-300 font-medium">{freeBannerText}</span>
          <button
            type="button"
            onClick={onUnlockClick}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-extrabold hover:bg-zinc-200 transition cursor-pointer"
          >
            {unlockBtn}
          </button>
        </div>
      )}

      {/* 360° WebGL / WebXR 캔버스 (FOV 기반 확대·축소) */}
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <XR store={xrStore}>
          <color attach="background" args={['#18181b']} />
          <FovController fov={fov} />
          <PanoramaDome imageUrl={imageUrl} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.07}
            rotateSpeed={-0.45}
          />
        </XR>
      </Canvas>
    </div>
  );
}
