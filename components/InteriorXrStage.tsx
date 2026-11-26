'use client';

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import { useLanguage } from '@/components/LanguageProvider';

const xrStore = createXRStore();

interface InteriorXrStageProps {
  imageUrl: string;
  styleName: string;
  hasProCredits: boolean;
  onRequireUpgrade: () => void;
}

function ProceduralRoom({ imageUrl, styleName }: { imageUrl: string; styleName: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(imageUrl, (loadedTex) => {
      loadedTex.colorSpace = THREE.SRGBColorSpace;
      setTexture(loadedTex);
    });
  }, [imageUrl]);

  return (
    <group>
      {/* 1. 원목 질감 바닥 (5m x 5m, y = 0) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#d6cfc7" roughness={0.65} metalness={0.05} />
      </mesh>

      {/* 2. 천장 (y = 2.8m) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.8, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#f4f4f5" roughness={0.9} />
      </mesh>

      {/* 3. 좌·우측 및 후면 벽면 (x = -2.5m, +2.5m, z = +2.5m) */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-2.5, 1.4, 0]} receiveShadow>
        <planeGeometry args={[5, 2.8]} />
        <meshStandardMaterial color="#e4e4e7" roughness={0.85} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[2.5, 1.4, 0]} receiveShadow>
        <planeGeometry args={[5, 2.8]} />
        <meshStandardMaterial color="#e4e4e7" roughness={0.85} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[0, 1.4, 2.5]} receiveShadow>
        <planeGeometry args={[5, 2.8]} />
        <meshStandardMaterial color="#e4e4e7" roughness={0.85} />
      </mesh>

      {/* 4. 정면 AI 변환 결과 파노라마 아트월 (z = -2.48m) */}
      <mesh position={[0, 1.45, -2.48]}>
        <planeGeometry args={[4.4, 2.5]} />
        {texture ? (
          <meshStandardMaterial key="art-loaded" map={texture} roughness={0.35} />
        ) : (
          <meshStandardMaterial key="art-empty" color="#27272a" roughness={0.5} />
        )}
      </mesh>

      {/* 5. 절차적 3D 가구 배치: 미니멀 러그 + 로우 테이블 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -0.6]} receiveShadow>
        <planeGeometry args={[2.4, 1.6]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.22, -0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.44, 0.6]} />
        <meshStandardMaterial color="#785a46" roughness={0.4} />
      </mesh>

      {/* 상단 스타일 안내 라벨 */}
      <Text position={[0, 2.55, -2.4]} fontSize={0.14} color="#18181b" anchorX="center">
        {`HookAI Spatial Preview · ${styleName}`}
      </Text>
    </group>
  );
}

export default function InteriorXrStage({
  imageUrl,
  styleName,
  hasProCredits,
  onRequireUpgrade,
}: InteriorXrStageProps) {
  const { locale } = useLanguage();

  const handleEnterVR = () => {
    // 유료 크레딧 잠금 훅: 크레딧이 없으면 Paddle 결제창 오픈
    if (!hasProCredits) {
      onRequireUpgrade();
      return;
    }
    xrStore.enterVR();
  };

  const hintText =
    locale === 'ko'
      ? '드래그하여 360° 둘러보기 · 휠/핀치로 확대 · 눈높이 1.6m'
      : locale === 'ja'
      ? 'ドラッグで360°回転 · ズーム対応 · 目線高さ 1.6m'
      : locale === 'es'
      ? 'Arrastra para ver 360° · Pellizca para zoom · Altura 1.6m'
      : locale === 'zh'
      ? '拖动 360° 环顾 · 滚轮/双指缩放 · 视点高度 1.6m'
      : 'Drag to Look 360° · Scroll to Zoom · Eye-Level 1.6m';

  const vrButtonText = hasProCredits
    ? locale === 'ko'
      ? 'VR / Meta Quest 진입'
      : 'Enter VR / Meta Quest'
    : locale === 'ko'
    ? 'VR 모드 잠금 해제 ($10.90)'
    : 'Unlock VR Mode ($10.90)';

  return (
    <div className="relative w-full h-[460px] sm:h-[560px] rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-950 shadow-lg">
      {/* HookAI Studio 미니멀 오버레이 컨트롤 바 */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-zinc-950/80 backdrop-blur-md text-zinc-100 px-4 py-2 rounded-2xl text-[11px] sm:text-xs font-medium border border-white/10">
          {hintText}
        </div>

        <button
          type="button"
          onClick={handleEnterVR}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold shadow-md transition cursor-pointer"
        >
          <span>{vrButtonText}</span>
        </button>
      </div>

      {/* WebGL / WebXR 캔버스 (성인 눈높이 y = 1.6m 설정) */}
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.6, 1.4], fov: 65 }}>
        <XR store={xrStore}>
          <color attach="background" args={['#18181b']} />
          <ambientLight intensity={0.65} />
          <directionalLight
            position={[2.5, 4, 2.5]}
            intensity={1.3}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <Environment preset="city" />

          <ProceduralRoom imageUrl={imageUrl} styleName={styleName} />

          <ContactShadows position={[0, 0.02, -0.6]} opacity={0.4} scale={5} blur={2} />
          <OrbitControls
            target={[0, 1.45, -1.2]}
            enablePan={false}
            minDistance={0.5}
            maxDistance={2.2}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        </XR>
      </Canvas>
    </div>
  );
}
