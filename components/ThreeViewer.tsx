
import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ProductState } from '../types';

interface ShirtProps {
  state: ProductState;
}

interface LogoDecalProps {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

const LogoDecal: React.FC<LogoDecalProps> = ({ url, position, rotation, scale }) => {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  return (
    <Decal
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <meshPhysicalMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-10}
        roughness={1}
        metalness={0}
        alphaTest={0.01}
      />
    </Decal>
  );
};

const ShirtModel: React.FC<ShirtProps> = ({ state }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Material designed for a realistic fabric look
  const fabricMaterial = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(state.color),
      roughness: state.roughness,
      metalness: state.metalness,
      sheen: 0.2,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color(0xffffff),
      side: THREE.DoubleSide,
      clearcoat: state.clearcoat,
    });

    // Procedural pique texture for polo
    if (state.type === 'polo') {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#eeeeee';
        for (let x = 0; x < 64; x += 4) {
          for (let y = 0; y < 64; y += 4) {
            if ((x + y) % 8 === 0) {
              ctx.fillRect(x, y, 2, 2);
            }
          }
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(20, 20);
      material.bumpMap = texture;
      material.bumpScale = state.textureIntensity * 0.005;
    }

    return material;
  }, [state.color, state.roughness, state.metalness, state.clearcoat, state.type]);

  const isLongSleeve = state.type === 'long_sleeve';
  const isHoodie = state.type === 'hoodie';
  const isPolo = state.type === 'polo';

  return (
    <group position={[0, -0.2, 0]}>
      {/* Main Body - Slightly tapered cylinder for a torso shape */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.52, 1, 64]} />
        <primitive object={fabricMaterial} attach="material" />
        
        {/* Front Decal */}
        {state.logos.front && (
          <LogoDecal
            url={state.logos.front}
            position={[0, 0.15, 0.51]}
            rotation={[0, 0, 0]}
            scale={state.logoScale * 0.5}
          />
        )}

        {/* Back Decal */}
        {state.logos.back && (
          <LogoDecal
            url={state.logos.back}
            position={[0, 0.15, -0.51]}
            rotation={[0, Math.PI, 0]}
            scale={state.logoScale * 0.5}
          />
        )}
      </mesh>

      {/* Sleeves */}
      <group position={[0, 0.35, 0]}>
        {/* Left Sleeve */}
        <mesh position={[0.62, -0.15, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.2, 0.18, isLongSleeve ? 1.1 : 0.45, 32]} />
          <primitive object={fabricMaterial} attach="material" />
          {state.logos.leftSleeve && (
            <LogoDecal
              url={state.logos.leftSleeve}
              position={[0.21, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              scale={state.logoScale * 0.25}
            />
          )}
        </mesh>

        {/* Right Sleeve */}
        <mesh position={[-0.62, -0.15, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.2, 0.18, isLongSleeve ? 1.1 : 0.45, 32]} />
          <primitive object={fabricMaterial} attach="material" />
          {state.logos.rightSleeve && (
            <LogoDecal
              url={state.logos.rightSleeve}
              position={[-0.21, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              scale={state.logoScale * 0.25}
            />
          )}
        </mesh>
      </group>

      {/* Collar - Crew neck style */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.05, 16, 64]} />
        <primitive object={fabricMaterial} attach="material" />
      </mesh>

      {/* Type-specific additions */}
      {isPolo && (
        <group position={[0, 0.48, 0.48]}>
          {/* Collar */}
          <mesh rotation={[0.3, 0, 0]} position={[0, 0.02, -0.05]}>
            <torusGeometry args={[0.22, 0.06, 12, 40, Math.PI * 1.4]} />
            <primitive object={fabricMaterial} attach="material" />
          </mesh>
          {/* Placket */}
          <mesh position={[0, -0.15, 0.03]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.12, 0.3, 0.02]} />
            <primitive object={fabricMaterial} attach="material" />
          </mesh>
          {/* Buttons */}
          {[0, -0.08, -0.16].map((y, i) => (
            <mesh key={i} position={[0, y - 0.05, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.01, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {isHoodie && (
        <mesh position={[0, 0.6, -0.1]} rotation={[-0.3, 0, 0]}>
          <sphereGeometry args={[0.42, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
          <primitive object={fabricMaterial} attach="material" />
        </mesh>
      )}

      {/* Bottom Hem Detail */}
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.01, 8, 64]} />
        <primitive object={fabricMaterial} attach="material" />
      </mesh>
    </group>
  );
};

const ThreeViewer: React.FC<ShirtProps> = ({ state }) => {
  return (
    <div className="w-full h-full overflow-hidden relative">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 2.5], fov: 35 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.2} />
        <spotLight position={[10, 15, 10]} angle={0.25} penumbra={1} intensity={15} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={5} />
        
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.1}>
            <ShirtModel state={state} />
          </Float>
          <Environment preset="studio" />
          <ContactShadows position={[0, -1.1, 0]} opacity={0.4} scale={10} blur={2.5} far={2} />
        </Suspense>
        
        <OrbitControls 
          enablePan={false} 
          minDistance={1.2} 
          maxDistance={4} 
          makeDefault 
        />
      </Canvas>
    </div>
  );
};

export default ThreeViewer;
