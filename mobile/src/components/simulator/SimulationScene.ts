import * as THREE from 'three';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { TATTOO_FRAGMENT_SHADER, TATTOO_VERTEX_SHADER } from './tattooShader';
import { createDepthTexture, createImageTexture, type DepthPrecision } from './glTextures';
import { IDENTITY_TRANSFORM, placeTattoo, type TattooTransform } from './tattooMath';
import type { DepthMap } from '../../utils/depthPng';
import type { LocalImage } from '../../utils/localImage';

export interface SimulationSceneOptions {
  /** Subdivisões do plano por eixo. 128 dá (129)² vértices, o bastante para o relevo ficar suave. */
  segments?: number;
  /** Campo de visão vertical da câmera em graus. Menor = menos "estufamento" por perspectiva. */
  fieldOfView?: number;
  /** Cor de fundo (vista só se o plano não cobrir o viewport). */
  clearColor?: number;
}

/** Altura do plano em unidades de mundo; a largura é `PLANE_HEIGHT * aspecto da foto`. */
const PLANE_HEIGHT = 2;

type Uniforms = {
  uSkinMap: THREE.IUniform<THREE.Texture | null>;
  uDepthMap: THREE.IUniform<THREE.Texture | null>;
  uTattooMap: THREE.IUniform<THREE.Texture | null>;
  uHasDepth: THREE.IUniform<number>;
  uHasTattoo: THREE.IUniform<number>;
  uDisplacementScale: THREE.IUniform<number>;
  uDepthTexel: THREE.IUniform<THREE.Vector2>;
  uPlaneSize: THREE.IUniform<THREE.Vector2>;
  uAspect: THREE.IUniform<number>;
  uTattooCenter: THREE.IUniform<THREE.Vector2>;
  uTattooHalfSize: THREE.IUniform<THREE.Vector2>;
  uTattooRotation: THREE.IUniform<number>;
  uTattooOpacity: THREE.IUniform<number>;
  uInkShading: THREE.IUniform<number>;
  uLightDir: THREE.IUniform<THREE.Vector3>;
};

/**
 * Cena three.js da simulação: um plano subdividido, deslocado pelo depth map no vertex shader,
 * com a foto da pele e a tatuagem compostas no fragment shader (ver `tattooShader.ts`).
 *
 * Tudo que toca a GPU vive aqui, fora do React: o componente só repassa props e gestos. Os
 * renders são sob demanda (`requestRender` agrupa várias mudanças num único frame), então a tela
 * parada não gasta GPU/bateria e os gestos ainda rendem 60 FPS.
 *
 * `dispose()` libera texturas, geometria, material e renderer — chamar sempre que o contexto GL
 * for descartado, senão as texturas (até 2048² RGBA cada) ficam vivas na memória do aparelho.
 */
export class SimulationScene {
  readonly gl: ExpoWebGLRenderingContext;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly material: THREE.ShaderMaterial;
  readonly uniforms: Uniforms;

  private geometry: THREE.PlaneGeometry | null = null;
  private mesh: THREE.Mesh | null = null;
  private skinTexture: THREE.Texture | null = null;
  private depthTexture: THREE.DataTexture | null = null;
  private tattooTexture: THREE.Texture | null = null;

  private photoAspect = 4 / 3;
  private tattooAspect = 1;
  private viewHeight = 0;
  private transform: TattooTransform = { ...IDENTITY_TRANSFORM };
  private depthPrecision: DepthPrecision | null = null;

  private readonly segments: number;
  private readonly fieldOfView: number;
  private frameHandle: number | null = null;
  private disposed = false;

  constructor(gl: ExpoWebGLRenderingContext, options: SimulationSceneOptions = {}) {
    this.gl = gl;
    this.segments = options.segments ?? 128;
    this.fieldOfView = options.fieldOfView ?? 20;

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    // O three espera um elemento canvas; no RN passamos um objeto mínimo com o que o renderer
    // toca (dimensões, style e listeners de perda de contexto).
    const canvas = {
      width,
      height,
      clientWidth: width,
      clientHeight: height,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => gl,
    } as unknown as HTMLCanvasElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl,
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor(options.clearColor ?? 0xeae0d5, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.fieldOfView, width / Math.max(height, 1), 0.1, 100);

    this.uniforms = {
      uSkinMap: { value: null },
      uDepthMap: { value: null },
      uTattooMap: { value: null },
      uHasDepth: { value: 0 },
      uHasTattoo: { value: 0 },
      uDisplacementScale: { value: 0.4 },
      uDepthTexel: { value: new THREE.Vector2(0, 0) },
      uPlaneSize: { value: new THREE.Vector2(PLANE_HEIGHT * this.photoAspect, PLANE_HEIGHT) },
      uAspect: { value: this.photoAspect },
      uTattooCenter: { value: new THREE.Vector2(0, 0) },
      uTattooHalfSize: { value: new THREE.Vector2(0.5, 0.5) },
      uTattooRotation: { value: 0 },
      uTattooOpacity: { value: 0.9 },
      uInkShading: { value: 0.6 },
      uLightDir: { value: new THREE.Vector3(-0.35, 0.55, 0.8).normalize() },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: TATTOO_VERTEX_SHADER,
      fragmentShader: TATTOO_FRAGMENT_SHADER,
      uniforms: this.uniforms,
    });

    this.rebuildPlane();
  }

  /** Altura do canvas em pontos (dp), para converter o arraste dos gestos em unidades da foto. */
  setViewSize(_width: number, height: number): void {
    this.viewHeight = height;
    this.updateTattooPlacement();
  }

  /** Foto da pele. Sobe a textura na hora, então o arquivo pode ser apagado logo depois. */
  setSkin(image: LocalImage): void {
    if (this.disposed) return;
    const texture = createImageTexture(image);
    this.skinTexture?.dispose();
    this.skinTexture = texture;
    this.uniforms.uSkinMap.value = texture;

    const aspect = image.width / image.height;
    if (Math.abs(aspect - this.photoAspect) > 1e-6) {
      this.photoAspect = aspect;
      this.rebuildPlane();
    }
    this.renderer.initTexture(texture);
    this.updateTattooPlacement();
    this.requestRender();
  }

  setDepthMap(map: DepthMap | null): void {
    if (this.disposed) return;
    this.depthTexture?.dispose();
    this.depthTexture = null;
    this.depthPrecision = null;

    if (!map) {
      this.uniforms.uDepthMap.value = null;
      this.uniforms.uHasDepth.value = 0;
      this.requestRender();
      return;
    }

    const { texture, precision } = createDepthTexture(map, this.renderer, this.gl);
    this.depthTexture = texture;
    this.depthPrecision = precision;
    this.uniforms.uDepthMap.value = texture;
    this.uniforms.uDepthTexel.value.set(1 / map.width, 1 / map.height);
    this.uniforms.uHasDepth.value = 1;
    this.requestRender();
  }

  /** Formato que o driver aceitou para o depth map (null = sem depth map). */
  getDepthPrecision(): DepthPrecision | null {
    return this.depthPrecision;
  }

  setTattoo(image: LocalImage | null): void {
    if (this.disposed) return;
    this.tattooTexture?.dispose();
    this.tattooTexture = null;

    if (!image) {
      this.uniforms.uTattooMap.value = null;
      this.uniforms.uHasTattoo.value = 0;
      this.requestRender();
      return;
    }

    const texture = createImageTexture(image);
    this.tattooTexture = texture;
    this.tattooAspect = image.width / image.height;
    this.uniforms.uTattooMap.value = texture;
    this.uniforms.uHasTattoo.value = 1;
    this.renderer.initTexture(texture);
    this.updateTattooPlacement();
    this.requestRender();
  }

  setTransform(partial: Partial<TattooTransform>): void {
    this.transform = { ...this.transform, ...partial };
    this.updateTattooPlacement();
    this.requestRender();
  }

  getTransform(): TattooTransform {
    return { ...this.transform };
  }

  setDisplacementScale(value: number): void {
    this.uniforms.uDisplacementScale.value = Math.max(0, value);
    this.requestRender();
  }

  setTattooOpacity(value: number): void {
    this.uniforms.uTattooOpacity.value = THREE.MathUtils.clamp(value, 0, 1);
    this.requestRender();
  }

  setInkShading(value: number): void {
    this.uniforms.uInkShading.value = THREE.MathUtils.clamp(value, 0, 1);
    this.requestRender();
  }

  /** Agenda um render para o próximo frame; várias chamadas no mesmo frame viram um render só. */
  requestRender(): void {
    if (this.disposed || this.frameHandle !== null) return;
    this.frameHandle = requestAnimationFrame(() => {
      this.frameHandle = null;
      this.renderNow();
    });
  }

  /** Renderiza imediatamente (usado antes de capturar o snapshot). */
  renderNow(): void {
    if (this.disposed) return;
    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.renderer.render(this.scene, this.camera);
    this.gl.endFrameEXP();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
    // O contexto GL pode já ter sido destruído junto com a GLView: nada aqui pode lançar.
    try {
      this.skinTexture?.dispose();
      this.depthTexture?.dispose();
      this.tattooTexture?.dispose();
      this.geometry?.dispose();
      this.material.dispose();
      this.renderer.dispose();
    } catch (error) {
      console.warn('[Simulador] Falha ao liberar recursos WebGL:', error);
    }
    this.skinTexture = null;
    this.depthTexture = null;
    this.tattooTexture = null;
    this.geometry = null;
    this.mesh = null;
  }

  private rebuildPlane(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    this.geometry?.dispose();

    const width = PLANE_HEIGHT * this.photoAspect;
    this.geometry = new THREE.PlaneGeometry(width, PLANE_HEIGHT, this.segments, this.segments);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    // O deslocamento acontece no shader; o bounding box da geometria plana não serve para o culling.
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    this.uniforms.uPlaneSize.value.set(width, PLANE_HEIGHT);
    this.uniforms.uAspect.value = this.photoAspect;
    this.updateCamera();
  }

  private updateCamera(): void {
    const width = this.gl.drawingBufferWidth;
    const height = Math.max(this.gl.drawingBufferHeight, 1);
    this.camera.aspect = width / height;
    // Distância em que o plano sem deslocamento preenche exatamente a altura do viewport. Com o
    // deslocamento, as partes mais próximas (depth → 1) avançam e ganham um leve aumento de
    // perspectiva — é o que dá a sensação de volume sem orbitar a câmera.
    const distance = PLANE_HEIGHT / 2 / Math.tan(THREE.MathUtils.degToRad(this.fieldOfView) / 2);
    this.camera.position.set(0, 0, distance);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  private updateTattooPlacement(): void {
    const placement = placeTattoo(this.transform, this.photoAspect, this.tattooAspect, this.viewHeight);
    this.uniforms.uTattooCenter.value.set(placement.center[0], placement.center[1]);
    this.uniforms.uTattooHalfSize.value.set(placement.halfSize[0], placement.halfSize[1]);
    this.uniforms.uTattooRotation.value = placement.rotation;
  }
}
