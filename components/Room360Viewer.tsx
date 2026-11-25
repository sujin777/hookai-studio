'use client';

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
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
    const loader = new THREE.TextureLoader();
    loader.load(imageUrl, (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      // 360° 구에 감쌀 때 뒷면 이음새가 부드럽게 이어지도록 미러링 래핑 적용
      loaded.wrapS = THREE.MirroredRepeatWrapping;
      loaded.wrapT = THREE.ClampToEdgeWrapping;
      loaded.repeat.set(2, 1);
      loaded.needsUpdate = true;
      setTexture(loaded);
    });
  }, [imageUrl]);

  return (
    // scale={[-1, 1, 1]}로 좌우 반전을 보정하여 구 안쪽에서 정방향으로 보이게 처리
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[10, 64, 48]} />
      {texture ? (
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      ) : (
        <meshBasicMaterial color="#18181b" side={THREE.BackSide} />
      )}
    </mesh>
  );
}

export default function Room360Viewer({
  imageUrl,
  isWatermarked,
  onUnlockClick,
}: Room360ViewerProps) {
  const { locale } = useLanguage();

  const touchHint =
    locale === 'ko'
      ? '👆 손가락 터치 또는 드래그로 360° 둘러보기'
      : locale === 'ja'
      ? '👆 タッチまたはドラッグで360°見渡す'
      : locale === 'es'
      ? '👆 Toca o arrastra para ver 360°'
      : locale === 'zh'
      ? '👆 触摸或拖动 360° 环顾房间'
      : '👆 Touch or Drag to Look 360° Around';

  const vrBtn =
    locale === 'ko'
      ? 'VR 헤드셋 모드'
      : locale === 'ja'
      ? 'VRヘッドセット'
      : locale === 'es'
      ? 'Modo Visor VR'
      : locale === 'zh'
      ? 'VR 头显模式'
      : 'VR Headset Mode';

  const freeBannerText =
    locale === 'ko'
      ? '무료 360° 미리보기 · 고화질 원본 텍스처는 HD 팩으로 잠금 해제하세요'
      : 'Free 360° Preview · Unlock HD Pack for crisp full-res textures';

  const unlockBtn = locale === 'ko' ? 'HD 잠금 해제 ($10.90)' : 'Unlock HD ($10.90)';

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950 select-none touch-none">
      {/* 상단 조작 가이드 & VR 진입 버튼 */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-zinc-950/75 backdrop-blur-md text-zinc-100 px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border border-white/10">
          {touchHint}
        </div>

        <button
          type="button"
          onClick={() => xrStore.enterVR()}
          className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold shadow-md transition cursor-pointer"
        >
          {vrBtn}
        </button>
      </div>

      {/* 무료 체험 워터마크 오버레이 (유료 크레딧 사용 시 자동 해제) */}
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

      {/* 360° WebGL / WebXR 캔버스 */}
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <XR store={xrStore}>
          <PanoramaDome imageUrl={imageUrl} />
          {/* rotateSpeed를 음수(-0.45)로 설정해야 스마트폰 터치 시 실제 고개를 돌리는 방향과 일치 */}
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.07}
            rotateSpeed={-0.45}
            minDistance={0.05}
            maxDistance={4.5}
          />
        </XR>
      </Canvas>
    </div>
  );
}
