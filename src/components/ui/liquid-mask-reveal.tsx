"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";

export interface LiquidMaskRevealProps {
  imageBase: string;
  imageHover: string;
  altBase?: string;
  altHover?: string;
  className?: string;
  style?: React.CSSProperties;
  borderRadius?: string | number;
  radius?: number; // Normalized 10-1000, default 120
  blur?: number; // 0-1, default 0.5
  circleBoost?: number; // 0-1, default 0.65
  texture?: number; // 0-1 grain/noise, default 0.7
  timeSpeed?: number; // 0-10, default 5
  splatRadius?: number; // default 0.08
  /** Brush radius in px. Overrides splatRadius, and can change without a restart. */
  brushPx?: number;
  /**
   * Multiplies the edge-noise frequency. The noise is laid out across the
   * container, so a larger container needs a larger scale for the same grain.
   */
  noiseScale?: number;
  velocityDissipation?: number; // default 0.99
  shrinkTimeSeconds?: number; // default 2.2s
  curl?: number; // swirl vorticity, default 30
  pressureIterations?: number; // default 25
  fitMode?: "contain-bottom" | "contain-center" | "cover";
  imageClassName?: string;
  parallax?: boolean;
  parallaxAmount?: number;
  parallaxSmoothing?: number;
  /** When the hover image is itself a transparent cutout, the base must be cleared under
   *  the brush or both subjects show through each other. The base is then drawn in the
   *  shader alongside the hover image (both plates must share one aspect ratio). */
  knockout?: boolean;
}

export const LiquidMaskReveal: React.FC<LiquidMaskRevealProps> = ({
  imageBase,
  imageHover,
  altBase = "Base Image",
  className = "",
  style = {},
  imageClassName = "",
  borderRadius = 0,
  radius = 120,
  blur = 0.5,
  circleBoost = 0.65,
  texture = 0.7,
  timeSpeed = 5,
  splatRadius = 0.08,
  brushPx,
  noiseScale = 1,
  velocityDissipation = 0.99,
  shrinkTimeSeconds = 2.2,
  curl = 30,
  pressureIterations = 25,
  fitMode = "contain-bottom",
  parallax = false,
  parallaxAmount = 50,
  parallaxSmoothing = 0,
  knockout = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Read by the render loop each frame, so a new size needs no restart
  const brushPxRef = useRef(brushPx);
  brushPxRef.current = brushPx;
  const noiseScaleRef = useRef(noiseScale);
  noiseScaleRef.current = noiseScale;

  // Value mapping functions
  const mapRadius = useCallback((r: number) => 10 + (r - 10) * (190 / 990), []);
  const mapBlur = useCallback((b: number) => 0.2 + b * 2.8, []);
  const mapCircleBoost = useCallback((cb: number) => 0.5 + cb * 3.5, []);
  const mapTimeSpeed = useCallback((ts: number) => ts * 0.1, []);
  const mapTexture = useCallback((t: number) => {
    const freq = 2 + t * 12;
    const strength = t * 3;
    const size = 1 - t * 0.7;
    return { freq, strength, size };
  }, []);

  // Detect mobile/coarse pointer
  useEffect(() => {
    const check = () => {
      const coarse =
        typeof window !== "undefined" && window.matchMedia
          ? window.matchMedia("(pointer: coarse)").matches
          : false;
      const small =
        typeof window !== "undefined" && window.matchMedia
          ? window.matchMedia("(max-width: 768px)").matches
          : false;
      setIsMobile(coarse || small);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const baseImg = imgRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isAnimating = false;
    let rafId = 0;

    // Three.js Scene & Perspective Camera
    const scene = new THREE.Scene();
    const perspective = 800;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0, 0);

    const initialWidth = Math.max(container.clientWidth, 200);
    const initialHeight = Math.max(container.clientHeight, 200);
    // updateStyle must stay false: the canvas is sized by its own `inset-0 w-full h-full`
    // classes, and every later setSize below also passes false. Letting three.js write an
    // inline width/height here would pin the canvas to the 200px fallback for good,
    // whenever the container has not been laid out yet on first run.
    renderer.setSize(initialWidth, initialHeight, false);

    const computeFov = () =>
      (180 * (2 * Math.atan(container.clientHeight / 2 / perspective))) / Math.PI;

    const camera = new THREE.PerspectiveCamera(
      computeFov(),
      initialWidth / initialHeight,
      1,
      5000
    );
    camera.position.set(0, 0, perspective);

    // Front image texture for reveal
    const loader = new THREE.TextureLoader();
    const frontTexture = loader.load(imageHover || imageBase, (tex) => {
      if (tex.image) {
        const aspect = tex.image.width / tex.image.height;
        uniforms.u_frontImageAspect.value = aspect;
        if (isAnimating) renderer.render(scene, camera);
      }
    });
    frontTexture.minFilter = THREE.LinearFilter;
    frontTexture.magFilter = THREE.LinearFilter;

    // Knockout: the base plate moves into the shader once it is ready, and the <img>
    // (still there for first paint and SSR) is hidden after the first frame that draws it.
    let baseTexture: THREE.Texture | null = null;
    let hideBaseImg = false;
    if (knockout) {
      baseTexture = loader.load(imageBase, () => {
        uniforms.u_baseReady.value = 1;
        hideBaseImg = true;
      });
      baseTexture.minFilter = THREE.LinearFilter;
      baseTexture.magFilter = THREE.LinearFilter;
    }

    const textureParams = mapTexture(texture);

    // Fluid simulation setup
    const simScale = 0.5;
    let simWidth = Math.max(1, Math.floor(initialWidth * simScale));
    let simHeight = Math.max(1, Math.floor(initialHeight * simScale));

    const fboOptions: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      generateMipmaps: false,
      depthBuffer: false,
      stencilBuffer: false,
    };

    const createFluidFBO = (w: number, h: number) =>
      new THREE.WebGLRenderTarget(w, h, fboOptions);

    let velFBO0 = createFluidFBO(simWidth, simHeight);
    let velFBO1 = createFluidFBO(simWidth, simHeight);
    let divFBO = createFluidFBO(simWidth, simHeight);
    let pressureFBO0 = createFluidFBO(simWidth, simHeight);
    let pressureFBO1 = createFluidFBO(simWidth, simHeight);
    let densityFBO0 = createFluidFBO(simWidth, simHeight);
    let densityFBO1 = createFluidFBO(simWidth, simHeight);

    const disposeFluidFBOs = () => {
      velFBO0.dispose();
      velFBO1.dispose();
      divFBO.dispose();
      pressureFBO0.dispose();
      pressureFBO1.dispose();
      densityFBO0.dispose();
      densityFBO1.dispose();
    };

    const resizeFluidFBOs = (w: number, h: number) => {
      const newSimWidth = Math.max(1, Math.floor(w * simScale));
      const newSimHeight = Math.max(1, Math.floor(h * simScale));
      if (newSimWidth === simWidth && newSimHeight === simHeight) return;
      simWidth = newSimWidth;
      simHeight = newSimHeight;
      disposeFluidFBOs();
      velFBO0 = createFluidFBO(simWidth, simHeight);
      velFBO1 = createFluidFBO(simWidth, simHeight);
      divFBO = createFluidFBO(simWidth, simHeight);
      pressureFBO0 = createFluidFBO(simWidth, simHeight);
      pressureFBO1 = createFluidFBO(simWidth, simHeight);
      densityFBO0 = createFluidFBO(simWidth, simHeight);
      densityFBO1 = createFluidFBO(simWidth, simHeight);
    };

    const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);

    let lastMouseUV = { x: 0.5, y: 0.5 };
    const mouseVelocity = { x: 0, y: 0 };

    // Fit mode: 0 = contain-bottom, 1 = contain-center, 2 = cover
    const fitCode =
      fitMode === "contain-bottom" ? 0 : fitMode === "contain-center" ? 1 : 2;

    const uniforms = {
      u_time: { value: 0 },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_progress: { value: 0 },
      u_planeRes: { value: new THREE.Vector2(initialWidth, initialHeight) },
      u_radius: { value: mapRadius(radius) },
      u_blur: { value: mapBlur(blur) },
      u_circleBoost: { value: mapCircleBoost(circleBoost) },
      u_noiseFreq: { value: textureParams.freq },
      u_noiseStrength: { value: textureParams.strength },
      u_noiseSize: { value: textureParams.size },
      u_noiseScale: { value: 1 },
      u_timeSpeed: { value: mapTimeSpeed(timeSpeed) },
      u_frontImage: { value: frontTexture },
      u_frontImageAspect: { value: 1 },
      u_containerAspect: { value: initialWidth / initialHeight },
      u_fitMode: { value: fitCode },
      u_parallaxOffset: { value: new THREE.Vector2(0, 0) },
      u_parallaxMax: { value: parallax ? Math.max(0, parallaxAmount) : 0 },
      u_densityTex: { value: densityFBO0.texture },
      u_baseImage: { value: baseTexture },
      u_baseReady: { value: 0 },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const vertexShaderQuad = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const splatFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 u_point;
      uniform vec2 u_splatColor;
      uniform float u_radius;
      uniform float u_aspectRatio;
      uniform sampler2D u_target;
      void main() {
        vec2 p = vUv - u_point;
        p.x *= max(u_aspectRatio, 1.0);
        p.y *= max(1.0 / u_aspectRatio, 1.0);
        float splat = exp(-dot(p, p) / (u_radius * u_radius));
        vec4 base = texture2D(u_target, vUv);
        base.xy += splat * u_splatColor;
        gl_FragColor = base;
      }
    `;

    const splatDensityFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 u_point;
      uniform float u_radius;
      uniform float u_aspectRatio;
      uniform float u_densityAmount;
      uniform sampler2D u_target;
      void main() {
        vec2 p = vUv - u_point;
        p.x *= max(u_aspectRatio, 1.0);
        p.y *= max(1.0 / u_aspectRatio, 1.0);
        float splat = exp(-dot(p, p) / (u_radius * u_radius));
        float base = texture2D(u_target, vUv).r;
        gl_FragColor = vec4(base + splat * u_densityAmount, 0.0, 0.0, 1.0);
      }
    `;

    const advectFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D u_velocity;
      uniform sampler2D u_source;
      uniform vec2 u_texelSize;
      uniform float u_dt;
      uniform float u_dissipationMultiply;
      void main() {
        vec2 vel = texture2D(u_velocity, vUv).xy;
        vec2 pos = vUv - vel * u_texelSize * u_dt;
        gl_FragColor = texture2D(u_source, pos) * u_dissipationMultiply;
      }
    `;

    const divergenceFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D u_velocity;
      uniform vec2 u_texelSize;
      void main() {
        float L = texture2D(u_velocity, vUv - vec2(u_texelSize.x, 0.0)).x;
        float R = texture2D(u_velocity, vUv + vec2(u_texelSize.x, 0.0)).x;
        float T = texture2D(u_velocity, vUv + vec2(0.0, u_texelSize.y)).y;
        float B = texture2D(u_velocity, vUv - vec2(0.0, u_texelSize.y)).y;
        float div = 0.5 * ((R - L) + (T - B));
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;

    const pressureFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D u_pressure;
      uniform sampler2D u_divergence;
      uniform vec2 u_texelSize;
      void main() {
        float L = texture2D(u_pressure, vUv - vec2(u_texelSize.x, 0.0)).r;
        float R = texture2D(u_pressure, vUv + vec2(u_texelSize.x, 0.0)).r;
        float T = texture2D(u_pressure, vUv + vec2(0.0, u_texelSize.y)).r;
        float B = texture2D(u_pressure, vUv - vec2(0.0, u_texelSize.y)).r;
        float C = texture2D(u_divergence, vUv).r;
        float p = (L + R + T + B - C) * 0.25;
        gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
      }
    `;

    const curlFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D u_velocity;
      uniform vec2 u_texelSize;
      uniform float u_curl;
      void main() {
        float vL = texture2D(u_velocity, vUv - vec2(u_texelSize.x, 0.0)).y;
        float vR = texture2D(u_velocity, vUv + vec2(u_texelSize.x, 0.0)).y;
        float vT = texture2D(u_velocity, vUv + vec2(0.0, u_texelSize.y)).x;
        float vB = texture2D(u_velocity, vUv - vec2(0.0, u_texelSize.y)).x;
        float curl = (vR - vL) - (vT - vB);
        vec2 vel = texture2D(u_velocity, vUv).xy;
        float strength = u_curl * 0.00015;
        vel.x += strength * (vT - vB);
        vel.y += strength * (vL - vR);
        gl_FragColor = vec4(vel, 0.0, 1.0);
      }
    `;

    const gradientFrag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D u_velocity;
      uniform sampler2D u_pressure;
      uniform vec2 u_texelSize;
      void main() {
        float L = texture2D(u_pressure, vUv - vec2(u_texelSize.x, 0.0)).r;
        float R = texture2D(u_pressure, vUv + vec2(u_texelSize.x, 0.0)).r;
        float T = texture2D(u_pressure, vUv + vec2(0.0, u_texelSize.y)).r;
        float B = texture2D(u_pressure, vUv - vec2(0.0, u_texelSize.y)).r;
        vec2 vel = texture2D(u_velocity, vUv).xy;
        vel.x -= 0.5 * (R - L);
        vel.y -= 0.5 * (T - B);
        gl_FragColor = vec4(vel, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_progress;
      uniform vec2 u_planeRes;
      uniform float u_radius;
      uniform float u_blur;
      uniform float u_circleBoost;
      uniform float u_noiseFreq;
      uniform float u_noiseStrength;
      uniform float u_noiseSize;
      uniform float u_noiseScale;
      uniform float u_timeSpeed;
      uniform sampler2D u_frontImage;
      uniform float u_frontImageAspect;
      uniform float u_containerAspect;
      uniform int u_fitMode; // 0 = contain-bottom, 1 = contain-center, 2 = cover
      uniform vec2 u_parallaxOffset;
      uniform float u_parallaxMax;
      uniform sampler2D u_densityTex;
      uniform sampler2D u_baseImage;
      uniform float u_baseReady;

      // Simplex 3D Noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vec2 uv = vUv;
        float density = texture2D(u_densityTex, uv).r * u_circleBoost * u_progress;

        // Noise for organic fluid edges
        float offx = uv.x + (u_time * u_timeSpeed * 0.1) + sin(uv.y + u_time * u_timeSpeed * 0.1);
        float offy = uv.y - cos(u_time * u_timeSpeed * 0.001) * 0.01;
        float effectiveNoiseFreq = u_noiseFreq / max(0.01, u_noiseSize) * u_noiseScale;
        float n1 = snoise(vec3(offx * effectiveNoiseFreq, offy * effectiveNoiseFreq, u_time * u_timeSpeed)) - 1.0;
        float n2 = snoise(vec3(offx * effectiveNoiseFreq * 0.5, offy * effectiveNoiseFreq * 0.5, u_time * u_timeSpeed * 0.7)) - 1.0;
        float n = (n1 + n2 * 0.5) * 0.7;

        float finalMask = smoothstep(0.35, 0.55, (n * u_noiseStrength) + pow(max(0.0, density), 1.5));

        // Responsive UV mapping
        vec2 responsiveUV = uv;
        bool outOfBounds = false;

        if (u_frontImageAspect > 0.0 && u_containerAspect > 0.0) {
          if (u_fitMode == 0) {
            // contain-bottom (ideal for cutout portraits standing on baseline)
            if (u_containerAspect >= u_frontImageAspect) {
              float scaleX = u_frontImageAspect / u_containerAspect;
              responsiveUV.x = (uv.x - 0.5) / scaleX + 0.5;
              responsiveUV.y = uv.y;
            } else {
              float scaleY = u_containerAspect / u_frontImageAspect;
              responsiveUV.x = uv.x;
              responsiveUV.y = uv.y / scaleY;
            }
          } else if (u_fitMode == 1) {
            // contain-center
            if (u_containerAspect >= u_frontImageAspect) {
              float scaleX = u_frontImageAspect / u_containerAspect;
              responsiveUV.x = (uv.x - 0.5) / scaleX + 0.5;
              responsiveUV.y = uv.y;
            } else {
              float scaleY = u_containerAspect / u_frontImageAspect;
              responsiveUV.x = uv.x;
              responsiveUV.y = (uv.y - 0.5) / scaleY + 0.5;
            }
          } else {
            // cover
            if (u_frontImageAspect > u_containerAspect) {
              float scale = u_frontImageAspect / u_containerAspect;
              responsiveUV.x = (uv.x - 0.5) / scale + 0.5;
            } else {
              float scale = u_containerAspect / u_frontImageAspect;
              responsiveUV.y = (uv.y - 0.5) / scale + 0.5;
            }
          }

          if (responsiveUV.x < 0.002 || responsiveUV.x > 0.998 || responsiveUV.y < 0.002 || responsiveUV.y > 0.998) {
            outOfBounds = true;
          }
        }

        if (outOfBounds) {
          gl_FragColor = vec4(0.0);
          return;
        }

        vec2 sampleUV = responsiveUV;
        if (u_parallaxMax > 0.0) {
          vec2 inset = u_parallaxMax / u_planeRes;
          vec2 baseUV = inset + responsiveUV * (1.0 - 2.0 * inset);
          vec2 parallaxUV = u_parallaxOffset / u_planeRes;
          sampleUV = baseUV + parallaxUV;
        }

        vec4 frontColor = texture2D(u_frontImage, sampleUV);

        if (u_baseReady > 0.5) {
          // Base outside the brush, hover inside it — never both at once
          vec4 baseColor = texture2D(u_baseImage, responsiveUV);
          float aBase = baseColor.a * (1.0 - finalMask);
          float aFront = frontColor.a * finalMask;
          float aOut = aBase + aFront;
          if (aOut < 0.004) { gl_FragColor = vec4(0.0); return; }
          gl_FragColor = vec4((baseColor.rgb * aBase + frontColor.rgb * aFront) / aOut, aOut);
          return;
        }

        float outAlpha = frontColor.a * finalMask;
        if (outAlpha < 0.01) outAlpha = 0.0;

        gl_FragColor = vec4(frontColor.rgb, outAlpha);
      }
    `;

    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Fluid simulation scene & materials
    const fluidScene = new THREE.Scene();
    const texelSize = new THREE.Vector2(1 / simWidth, 1 / simHeight);

    const splatVelMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderQuad,
      fragmentShader: splatFrag,
      uniforms: {
        u_point: { value: new THREE.Vector2(0.5, 0.5) },
        u_splatColor: { value: new THREE.Vector2(0, 0) },
        u_radius: { value: 0.02 },
        u_aspectRatio: { value: 1 },
        u_target: { value: velFBO0.texture },
      },
      depthWrite: false,
    });
    const quadMesh = new THREE.Mesh(quadGeometry, splatVelMaterial);
    fluidScene.add(quadMesh);

    const splatDensityMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderQuad,
      fragmentShader: splatDensityFrag,
      uniforms: {
        u_point: { value: new THREE.Vector2(0.5, 0.5) },
        u_radius: { value: 0.02 },
        u_aspectRatio: { value: 1 },
        u_densityAmount: { value: 1 },
        u_target: { value: densityFBO0.texture },
      },
      depthWrite: false,
    });

    const advectMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderQuad,
      fragmentShader: advectFrag,
      uniforms: {
        u_velocity: { value: velFBO0.texture },
        u_source: { value: velFBO0.texture },
        u_texelSize: { value: texelSize.clone() },
        u_dt: { value: 1 },
        u_dissipationMultiply: { value: 0.99 },
      },
      depthWrite: false,
    });

    const divergenceMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderQuad,
      fragmentShader: divergenceFrag,
      uniforms: {
        u_velocity: { value: velFBO0.texture },
        u_texelSize: { value: texelSize.clone() },
      },
      depthWrite: false,
    });

    const pressureMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderQuad,
      fragmentShader: pressureFrag,
      uniforms: {
        u_pressure: { value: pressureFBO0.texture },
        u_divergence: { value: divFBO.texture },
        u_texelSize: { value: texelSize.clone() },
      },
      depthWrite: false,
    });

    const gradientMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderQuad,
      fragmentShader: gradientFrag,
      uniforms: {
        u_velocity: { value: velFBO0.texture },
        u_pressure: { value: pressureFBO0.texture },
        u_texelSize: { value: texelSize.clone() },
      },
      depthWrite: false,
    });

    const curlMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderQuad,
      fragmentShader: curlFrag,
      uniforms: {
        u_velocity: { value: velFBO0.texture },
        u_texelSize: { value: texelSize.clone() },
        u_curl: { value: curl },
      },
      depthWrite: false,
    });

    const advectDensityMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShaderQuad,
      fragmentShader: advectFrag,
      uniforms: {
        u_velocity: { value: velFBO0.texture },
        u_source: { value: densityFBO0.texture },
        u_texelSize: { value: texelSize.clone() },
        u_dt: { value: 1 },
        u_dissipationMultiply: { value: 0.93 },
      },
      depthWrite: false,
    });

    const updateFromDOM = () => {
      const actualWidth = Math.max(container.clientWidth, 2);
      const actualHeight = Math.max(container.clientHeight, 2);

      mesh.position.set(0, 0, 0);
      mesh.scale.set(actualWidth, actualHeight, 1);

      renderer.setSize(actualWidth, actualHeight, false);
      // The fov is derived from the container's height, so it has to be recomputed here
      // and not just at init: on the first run the container is often not laid out yet,
      // which yields a fov of 0 and a camera that renders nothing at all.
      camera.fov = computeFov();
      camera.aspect = actualWidth / actualHeight;
      camera.updateProjectionMatrix();
      camera.position.z = perspective;
      camera.lookAt(0, 0, 0);

      uniforms.u_planeRes.value.set(actualWidth, actualHeight);
      const containerAspect = actualWidth / actualHeight;
      uniforms.u_containerAspect.value = containerAspect;

      if (frontTexture.image) {
        uniforms.u_frontImageAspect.value =
          frontTexture.image.width / frontTexture.image.height;
      }

      resizeFluidFBOs(actualWidth, actualHeight);
      texelSize.set(1 / simWidth, 1 / simHeight);

      if (isAnimating) {
        renderer.render(scene, camera);
      }
    };

    updateFromDOM();

    let isVisible = true;
    let targetProgress = 0;
    const clock = new THREE.Clock();
    const targetParallaxOffset = new THREE.Vector2(0, 0);

    // The simulation sleeps once the brush has fully drained and wakes on the
    // next pointer move. Nothing on screen changes while it sleeps: the density
    // has decayed below 0.1% by then, and the canvas keeps its last frame.
    // Ink fades per frame, so the wait is counted in frames, not seconds: on a
    // slow frame rate the ink takes longer to drain, and must not be frozen.
    let idleFrames = 0;

    const render = () => {
      if (!isVisible) {
        isAnimating = false;
        return;
      }

      idleFrames++;
      const drainFrames = 60 * (Math.max(0.5, Math.min(10, shrinkTimeSeconds)) * 1.6 + 0.5);
      const settled = Math.abs(targetProgress - uniforms.u_progress.value) < 0.001;
      if (idleFrames > drainFrames && settled) {
        isAnimating = false;
        rafId = 0;
        return;
      }

      isAnimating = true;
      rafId = requestAnimationFrame(render);
      const dt = clock.getDelta();
      uniforms.u_time.value += dt;
      uniforms.u_noiseScale.value = noiseScaleRef.current || 1;

      if (!parallax) {
        uniforms.u_parallaxOffset.value.set(0, 0);
      } else {
        const s = Math.max(0, Math.min(1, parallaxSmoothing));
        if (s === 0) {
          uniforms.u_parallaxOffset.value.copy(targetParallaxOffset);
        } else {
          const tau = 0.04 + (0.25 - 0.04) * s;
          const alpha = 1 - Math.exp(-dt / Math.max(1e-6, tau));
          uniforms.u_parallaxOffset.value.lerp(targetParallaxOffset, alpha);
        }
      }

      const mouseTarget = uniforms.u_mouse.value;
      mouseVelocity.x = mouseTarget.x - lastMouseUV.x;
      mouseVelocity.y = mouseTarget.y - lastMouseUV.y;
      lastMouseUV.x = mouseTarget.x;
      lastMouseUV.y = mouseTarget.y;

      // Size comes from updateFromDOM (run on every resize), not from the DOM
      // here: reading clientWidth each frame forced a full layout mid-scroll
      const containerAspect = uniforms.u_containerAspect.value;

      // The splat is measured in units of the container's shorter side
      const shortSide = Math.min(uniforms.u_planeRes.value.x, uniforms.u_planeRes.value.y);
      const splatRad = Math.max(
        0.005,
        brushPxRef.current && shortSide > 2 ? brushPxRef.current / shortSide : splatRadius,
      );
      const velDiss = Math.max(0.9, Math.min(1, velocityDissipation));
      const T = Math.max(0.5, Math.min(10, shrinkTimeSeconds));
      const denDiss = Math.pow(0.01, 1 / (60 * T));
      const pressureIters = Math.max(10, Math.min(50, Math.round(pressureIterations)));

      texelSize.set(1 / simWidth, 1 / simHeight);
      advectMaterial.uniforms.u_texelSize.value.copy(texelSize);
      divergenceMaterial.uniforms.u_texelSize.value.copy(texelSize);
      pressureMaterial.uniforms.u_texelSize.value.copy(texelSize);
      gradientMaterial.uniforms.u_texelSize.value.copy(texelSize);
      advectDensityMaterial.uniforms.u_texelSize.value.copy(texelSize);

      const gl = renderer.getContext();
      gl.disable(gl.BLEND);

      // 1) Splat velocity
      splatVelMaterial.uniforms.u_point.value.set(mouseTarget.x, mouseTarget.y);
      splatVelMaterial.uniforms.u_aspectRatio.value = containerAspect;
      splatVelMaterial.uniforms.u_splatColor.value.set(
        mouseVelocity.x * 30,
        mouseVelocity.y * 30
      );
      splatVelMaterial.uniforms.u_radius.value = splatRad;
      splatVelMaterial.uniforms.u_target.value = velFBO0.texture;
      quadMesh.material = splatVelMaterial;
      renderer.setRenderTarget(velFBO1);
      renderer.render(fluidScene, orthoCamera);

      // 2) Splat density
      splatDensityMaterial.uniforms.u_point.value.set(mouseTarget.x, mouseTarget.y);
      splatDensityMaterial.uniforms.u_aspectRatio.value = containerAspect;
      splatDensityMaterial.uniforms.u_radius.value = splatRad;
      splatDensityMaterial.uniforms.u_densityAmount.value = targetProgress > 0 ? 1.0 : 0.0;
      splatDensityMaterial.uniforms.u_target.value = densityFBO0.texture;
      quadMesh.material = splatDensityMaterial;
      renderer.setRenderTarget(densityFBO1);
      renderer.render(fluidScene, orthoCamera);

      // 3) Advect velocity
      advectMaterial.uniforms.u_velocity.value = velFBO1.texture;
      advectMaterial.uniforms.u_source.value = velFBO1.texture;
      advectMaterial.uniforms.u_dt.value = 1;
      advectMaterial.uniforms.u_dissipationMultiply.value = velDiss;
      quadMesh.material = advectMaterial;
      renderer.setRenderTarget(velFBO0);
      renderer.render(fluidScene, orthoCamera);

      // 3b) Curl (vorticity)
      if (curl > 0) {
        curlMaterial.uniforms.u_velocity.value = velFBO0.texture;
        curlMaterial.uniforms.u_curl.value = curl;
        quadMesh.material = curlMaterial;
        renderer.setRenderTarget(velFBO1);
        renderer.render(fluidScene, orthoCamera);
      }

      // 4) Divergence
      const velForDiv = curl > 0 ? velFBO1.texture : velFBO0.texture;
      divergenceMaterial.uniforms.u_velocity.value = velForDiv;
      quadMesh.material = divergenceMaterial;
      renderer.setRenderTarget(divFBO);
      renderer.render(fluidScene, orthoCamera);

      // 5) Pressure (Jacobi iterations)
      pressureMaterial.uniforms.u_divergence.value = divFBO.texture;
      let pressureRead = pressureFBO0;
      let pressureWrite = pressureFBO1;
      for (let i = 0; i < pressureIters; i++) {
        pressureMaterial.uniforms.u_pressure.value = pressureRead.texture;
        quadMesh.material = pressureMaterial;
        renderer.setRenderTarget(pressureWrite);
        renderer.render(fluidScene, orthoCamera);
        const tmp = pressureRead;
        pressureRead = pressureWrite;
        pressureWrite = tmp;
      }

      // 6) Subtract pressure gradient from velocity
      const velForGradientRead = curl > 0 ? velFBO1 : velFBO0;
      const velForGradientWrite = curl > 0 ? velFBO0 : velFBO1;
      gradientMaterial.uniforms.u_velocity.value = velForGradientRead.texture;
      gradientMaterial.uniforms.u_pressure.value = pressureRead.texture;
      quadMesh.material = gradientMaterial;
      renderer.setRenderTarget(velForGradientWrite);
      renderer.render(fluidScene, orthoCamera);

      // 7) Advect density
      advectDensityMaterial.uniforms.u_velocity.value = velForGradientWrite.texture;
      advectDensityMaterial.uniforms.u_source.value = densityFBO1.texture;
      advectDensityMaterial.uniforms.u_dt.value = 1;
      advectDensityMaterial.uniforms.u_dissipationMultiply.value = denDiss;
      quadMesh.material = advectDensityMaterial;
      renderer.setRenderTarget(densityFBO0);
      renderer.render(fluidScene, orthoCamera);

      if (curl <= 0) {
        const tmp = velFBO0;
        velFBO0 = velFBO1;
        velFBO1 = tmp;
      }

      renderer.setRenderTarget(null);
      renderer.clear();
      gl.enable(gl.BLEND);

      uniforms.u_densityTex.value = densityFBO0.texture;
      uniforms.u_progress.value += (targetProgress - uniforms.u_progress.value) * 0.08;

      renderer.render(scene, camera);

      if (hideBaseImg && baseImg) {
        hideBaseImg = false;
        baseImg.style.visibility = "hidden";
      }
    };

    render();

    // Mouse / Pointer / Touch movement
    const onMove = (e: MouseEvent | PointerEvent | TouchEvent) => {
      const clientX = "touches" in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;
      if (clientX === undefined || clientY === undefined) return;

      const rect = container.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = 1 - (clientY - rect.top) / rect.height;

      const isInside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (isInside) {
        targetProgress = 1;
        idleFrames = 0;
        if (!isAnimating) {
          clock.getDelta(); // don't count the nap as one long frame
          render();
        }
        const nx = Math.max(0, Math.min(1, x));
        const ny = Math.max(0, Math.min(1, y));
        uniforms.u_mouse.value.set(nx, ny);

        if (parallax && parallaxAmount > 0) {
          targetParallaxOffset.set(
            (nx - 0.5) * 2 * parallaxAmount,
            (ny - 0.5) * 2 * parallaxAmount
          );
        }
      } else {
        // Leaving: let the loop run once more so the reveal can ease out
        if (targetProgress !== 0 && !isAnimating) {
          idleFrames = 0;
          clock.getDelta();
          targetProgress = 0;
          render();
        }
        targetProgress = 0;
        targetParallaxOffset.set(0, 0);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateFromDOM();
      // A sleeping loop still owes the resized canvas a frame
      renderer.render(scene, camera);
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !isAnimating) {
          render();
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onMove);
      disposeFluidFBOs();
      quadGeometry.dispose();
      splatVelMaterial.dispose();
      splatDensityMaterial.dispose();
      advectMaterial.dispose();
      divergenceMaterial.dispose();
      pressureMaterial.dispose();
      gradientMaterial.dispose();
      curlMaterial.dispose();
      advectDensityMaterial.dispose();
      geometry.dispose();
      material.dispose();
      frontTexture.dispose();
      baseTexture?.dispose();
      if (baseImg) baseImg.style.visibility = "";
      renderer.dispose();
    };
  }, [
    imageBase,
    imageHover,
    radius,
    blur,
    circleBoost,
    texture,
    timeSpeed,
    splatRadius,
    velocityDissipation,
    shrinkTimeSeconds,
    curl,
    pressureIterations,
    fitMode,
    parallax,
    parallaxAmount,
    parallaxSmoothing,
    knockout,
    mapRadius,
    mapBlur,
    mapCircleBoost,
    mapTexture,
    mapTimeSpeed,
  ]);

  const fitClass =
    fitMode === "contain-bottom"
      ? "object-contain object-bottom"
      : fitMode === "contain-center"
      ? "object-contain object-center"
      : "object-cover object-center";

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden ${className}`}
      style={{ borderRadius, ...style }}
    >
      {/* Base Image */}
      <img
        ref={imgRef}
        src={imageBase}
        alt={altBase}
        draggable={false}
        decoding="async"
        className={`absolute inset-0 w-full h-full ${fitClass} ${imageClassName} pointer-events-none select-none`}
      />

      {/* WebGL Fluid Mask Stage */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${knockout ? imageClassName : ""}`}
      />
    </div>
  );
};

export default LiquidMaskReveal;
