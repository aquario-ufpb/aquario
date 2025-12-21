"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

type WaterRippleEffectProps = {
  imageSrc: string;
  width?: number;
  height?: number;
  waveIntensity?: number;
  rippleIntensity?: number;
  animationSpeed?: number;
  hoverRippleMultiplier?: number;
  transitionSpeed?: number;
  className?: string;
  containerClassName?: string;
  scale?: number;
  waveFrequency?: number;
  rippleFrequency?: number;
  distortionAmount?: number;
  onHover?: () => void;
  onLeave?: () => void;
};

export default function WaterRippleEffect({
  imageSrc,
  width = 920,
  height = 955,
  waveIntensity = 0.006,
  rippleIntensity = 0.012,
  animationSpeed = 1.0,
  hoverRippleMultiplier = 4.0,
  transitionSpeed = 0.08,
  className = "",
  containerClassName = "",
  scale = 1.0,
  waveFrequency = 10.0,
  rippleFrequency = 20.0,
  distortionAmount = 0.008,
  onHover,
  onLeave,
}: WaterRippleEffectProps & React.HTMLAttributes<HTMLDivElement>) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const timeRef = useRef(0);
  const isHoveredRef = useRef(false);
  const lastFrameTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const mouseMoveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (!mountElement) {
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "highp",
    });

    renderer.setSize(width, height);
    // Limit pixel ratio to 1.5 for better performance on high-DPI displays
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mountElement.appendChild(renderer.domElement);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imageSrc, loadedTexture => {
      loadedTexture.magFilter = THREE.LinearFilter;
      loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
      loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
      loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
      loadedTexture.generateMipmaps = true;
      loadedTexture.needsUpdate = true;
    });

    const vertexShader = `
      varying vec2 vUv;
      varying vec2 vPosition;

      void main() {
        vUv = uv;
        vPosition = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D texture1;
      uniform float time;
      uniform vec2 mouse;
      uniform float hoverIntensity;
      uniform float waveIntensity;
      uniform float rippleIntensity;
      uniform float animationSpeed;
      uniform float waveFrequency;
      uniform float rippleFrequency;
      uniform float distortionAmount;
      varying vec2 vUv;
      varying vec2 vPosition;

      // Improved smoothstep for better interpolation
      float smoothwave(float x) {
        return sin(x) * 0.5 + 0.5;
      }

      void main() {
        vec2 uv = vUv;
        
        // Reduced intensity for global waves to preserve image quality
        float waveScale = waveIntensity * 0.5;
        
        // Optimized: Pre-calculate time multipliers
        float t1 = time * animationSpeed * 2.0;
        float t2 = time * animationSpeed * 1.5;
        float t3 = time * animationSpeed * 2.5;
        
        // More subtle global wavy distortion
        float wave1 = sin(uv.x * waveFrequency + t1) * waveScale;
        float wave2 = sin(uv.y * (waveFrequency * 0.8) + t2) * (waveScale * 0.8);
        float wave3 = sin((uv.x + uv.y) * (waveFrequency * 1.2) + t3) * (waveScale * 0.3);
        
        // Mouse-based ripples - calculate distance once and reuse
        vec2 mouseDir = uv - mouse;
        float mouseDist = length(mouseDir);
        float dist = mouseDist; // Reuse for consistency
        
        // Improved falloff function for smoother transitions
        float falloff = exp(-dist * 4.0);
        float rippleScale = rippleIntensity * 0.7;
        
        // Pre-calculate time values for mouse effects
        float t4 = time * animationSpeed * 4.0;
        float t5 = time * animationSpeed * 3.0;
        float t6 = time * animationSpeed * 5.0;
        float t7 = time * animationSpeed * 3.5;
        
        float mouseWave1 = sin(dist * rippleFrequency - t4) * 
                          falloff * hoverIntensity * rippleScale;
        float mouseWave2 = sin(dist * (rippleFrequency * 0.75) - t5) * 
                          falloff * hoverIntensity * (rippleScale * 0.6);
        
        // More controlled expanding ripples (reuse mouseDist)
        float ripple1 = sin(mouseDist * (rippleFrequency * 1.25) - t6) * 
                       exp(-mouseDist * 5.0) * hoverIntensity * (rippleScale * 0.8);
        float ripple2 = sin(mouseDist * (rippleFrequency * 0.9) - t7) * 
                       exp(-mouseDist * 4.0) * hoverIntensity * (rippleScale * 0.6);
        
        // Reduced mouse-based radial distortion
        vec2 mouseDistortion = normalize(mouseDir) * sin(mouseDist * rippleFrequency - t4) * 
                              exp(-mouseDist * 4.0) * hoverIntensity * distortionAmount * 0.3;
        
        // Combine waves with reduced intensity
        float totalWave = (wave1 + wave2 + wave3 + mouseWave1 + mouseWave2 + ripple1 + ripple2) * 0.5;
        
        // More subtle distortion - pre-calculate time values
        float distortScale = distortionAmount * 0.6;
        float t8 = time * animationSpeed * 1.8;
        float t9 = time * animationSpeed * 2.2;
        float t10 = time * animationSpeed * 1.6;
        float t11 = time * animationSpeed * 2.0;
        
        vec2 distortion = vec2(
          sin(uv.x * (waveFrequency * 0.8) + t8) * distortScale * 0.4 + 
          sin(uv.y * (waveFrequency * 0.6) + t9) * distortScale * 0.3,
          sin(uv.y * (waveFrequency * 0.7) + t10) * distortScale * 0.4 + 
          sin(uv.x * (waveFrequency * 0.9) + t11) * distortScale * 0.3
        );
        
        // Combine distortions with reduced intensity
        vec2 finalDistortion = (distortion + mouseDistortion) * 0.7 + vec2(totalWave * 0.2, totalWave * 0.2);
        
        // Apply distortion to UV coordinates
        vec2 distortedUv = uv + finalDistortion;
        
        // Clamp UV coordinates to prevent sampling outside texture bounds
        distortedUv = clamp(distortedUv, 0.0, 1.0);
        
        // Sample texture with distorted coordinates
        vec4 color = texture2D(texture1, distortedUv);
        
        gl_FragColor = color;
      }
    `;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        texture1: { value: texture },
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0.5, 0.5) },
        hoverIntensity: { value: 0.3 },
        waveIntensity: { value: waveIntensity },
        rippleIntensity: { value: rippleIntensity },
        animationSpeed: { value: animationSpeed },
        waveFrequency: { value: waveFrequency },
        rippleFrequency: { value: rippleFrequency },
        distortionAmount: { value: distortionAmount },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const aspectRatio = width / height;
    // Reduced geometry segments for better performance (32x32 instead of 64x64)
    const geometry = new THREE.PlaneGeometry(4 * aspectRatio, 4, 32, 32);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 3;
    sceneRef.current = scene;
    rendererRef.current = renderer;
    materialRef.current = material;

    // Event handlers - throttle mouse move for better performance
    const handleMouseMove = (event: MouseEvent) => {
      if (mouseMoveTimeoutRef.current) {
        return; // Skip if already processing
      }
      mouseMoveTimeoutRef.current = window.setTimeout(() => {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = 1 - (event.clientY - rect.top) / rect.height;
        mouseRef.current = { x, y };
        mouseMoveTimeoutRef.current = null;
      }, 16); // ~60fps throttle
    };

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      onHover?.();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      onLeave?.();
    };

    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("mouseenter", handleMouseEnter);
    renderer.domElement.addEventListener("mouseleave", handleMouseLeave);

    const animate = (currentTime: number) => {
      // Use delta time for frame-rate independent animation
      const deltaTime =
        lastFrameTimeRef.current === 0
          ? 0.016
          : Math.min((currentTime - lastFrameTimeRef.current) / 1000, 0.1); // Cap at 100ms
      lastFrameTimeRef.current = currentTime;

      timeRef.current += deltaTime;

      if (materialRef.current) {
        materialRef.current.uniforms.time.value = timeRef.current;
        materialRef.current.uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);
        const targetIntensity = isHoveredRef.current ? hoverRippleMultiplier : 0.3;
        const currentIntensity = materialRef.current.uniforms.hoverIntensity.value;
        materialRef.current.uniforms.hoverIntensity.value +=
          (targetIntensity - currentIntensity) * transitionSpeed;
      }

      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      // Cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Clear mouse move timeout
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
        mouseMoveTimeoutRef.current = null;
      }
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      renderer.domElement.removeEventListener("mouseenter", handleMouseEnter);
      renderer.domElement.removeEventListener("mouseleave", handleMouseLeave);

      if (mountElement && renderer.domElement && mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [
    imageSrc,
    width,
    height,
    waveIntensity,
    rippleIntensity,
    animationSpeed,
    hoverRippleMultiplier,
    transitionSpeed,
    waveFrequency,
    rippleFrequency,
    distortionAmount,
    onHover,
    onLeave,
  ]);

  return (
    <div className={`w-full flex justify-center items-center ${containerClassName}`}>
      <div className="relative">
        <div
          ref={mountRef}
          className={`transition-transform duration-300 ${className}`}
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
