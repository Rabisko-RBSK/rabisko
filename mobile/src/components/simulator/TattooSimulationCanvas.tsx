import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { File } from 'expo-file-system';
import { SimulationScene } from './SimulationScene';
import { IDENTITY_TRANSFORM, type TattooTransform } from './tattooMath';
import { resolverImagemLocal, type ImageInfo } from '../../utils/localImage';
import type { DepthMap } from '../../utils/depthPng';

export interface SimulationSnapshot {
  /** Arquivo local (`file://`) com o frame capturado. */
  uri: string;
  width: number;
  height: number;
  /** Conteúdo em base64 (sem prefixo `data:`), só quando pedido em `captureSnapshot`. */
  base64?: string;
}

export interface CaptureSnapshotOptions {
  /** @default 'jpeg' */
  format?: 'jpeg' | 'png';
  /** 0 a 1. @default 0.92 */
  quality?: number;
  /** Também lê o arquivo e devolve em base64. @default false */
  base64?: boolean;
}

export interface TattooSimulationCanvasHandle {
  /** Atualiza posição/escala/rotação da tatuagem sem passar pelo React (caminho quente dos gestos). */
  setTransform(partial: Partial<TattooTransform>): void;
  getTransform(): TattooTransform;
  resetTransform(): void;
  /** Captura o frame atual do canvas WebGL como imagem. */
  captureSnapshot(options?: CaptureSnapshotOptions): Promise<SimulationSnapshot>;
}

export interface TattooSimulationCanvasProps extends Omit<ViewProps, 'style'> {
  /** Foto da pele (file://, http(s):// ou data:). Define a proporção do canvas. */
  skin: ImageInfo;
  /** Depth map decodificado da foto (`simulationService.gerarDepthMap`). Sem ele o plano fica reto. */
  depthMap?: DepthMap | null;
  /** PNG da tatuagem com fundo transparente. */
  tattoo?: ImageInfo | null;
  /** Intensidade do relevo em unidades de mundo (o plano tem 2 de altura). @default 0.4 */
  displacementScale?: number;
  /** Opacidade do pigmento sobre a pele. @default 0.9 */
  tattooOpacity?: number;
  /** Força do sombreamento do pigmento pela curvatura (0 = só multiply). @default 0.6 */
  inkShading?: number;
  /** Subdivisões do plano por eixo. @default 128 */
  segments?: number;
  /** Campo de visão vertical da câmera, em graus. @default 20 */
  fieldOfView?: number;
  initialTransform?: Partial<TattooTransform>;
  /** Chamado quando a foto da pele está na GPU e o primeiro frame foi desenhado. */
  onReady?: () => void;
  onError?: (error: Error) => void;
  style?: StyleProp<ViewStyle>;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Canvas WebGL (expo-gl + three.js) da simulação de tatuagem.
 *
 * Reconstrói o relevo da pele deslocando um plano subdividido pelo depth map e projeta a arte
 * sobre ele em modo Multiply, tudo na GPU — arrastar, pinçar e girar só trocam uniforms, sem
 * requisição ao servidor nem re-render do React. Os gestos ficam com quem usa o componente
 * (ver `SimuladorScreen`), que repassa o estado pela ref (`setTransform`).
 *
 * O contexto GL é recriado quando a foto muda de tamanho (a `GLView` ganha outra `key`); o
 * `SimulationScene` anterior é descartado antes, liberando as texturas no aparelho.
 */
export const TattooSimulationCanvas = forwardRef<TattooSimulationCanvasHandle, TattooSimulationCanvasProps>(
  function TattooSimulationCanvas(
    {
      skin,
      depthMap = null,
      tattoo = null,
      displacementScale = 0.4,
      tattooOpacity = 0.9,
      inkShading = 0.6,
      segments = 128,
      fieldOfView = 20,
      initialTransform,
      onReady,
      onError,
      style,
      onLayout,
      ...viewProps
    },
    ref,
  ) {
    const glViewRef = useRef<GLView>(null);
    const sceneRef = useRef<SimulationScene | null>(null);
    const sceneKeyRef = useRef<string | null>(null);
    const viewSizeRef = useRef({ width: 0, height: 0 });
    const transformRef = useRef<TattooTransform>({ ...IDENTITY_TRANSFORM, ...initialTransform });
    const readyNotifiedRef = useRef(false);
    const onReadyRef = useRef(onReady);
    const onErrorRef = useRef(onError);
    // Incrementa a cada contexto GL criado para os efeitos reaplicarem as props na cena nova.
    const [contextVersion, setContextVersion] = useState(0);

    useEffect(() => {
      onReadyRef.current = onReady;
      onErrorRef.current = onError;
    }, [onReady, onError]);

    const glKey = `${skin.width}x${skin.height}`;
    const aspectRatio = skin.height > 0 ? skin.width / skin.height : 4 / 3;

    const reportError = useCallback((error: unknown) => {
      const normalized = toError(error);
      console.error('[Simulador]', normalized);
      onErrorRef.current?.(normalized);
    }, []);

    const disposeScene = useCallback(() => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
      sceneKeyRef.current = null;
    }, []);

    const handleContextCreate = useCallback(
      (gl: ExpoWebGLRenderingContext) => {
        disposeScene();
        try {
          const scene = new SimulationScene(gl, { segments, fieldOfView });
          scene.setViewSize(viewSizeRef.current.width, viewSizeRef.current.height);
          scene.setTransform(transformRef.current);
          sceneRef.current = scene;
          sceneKeyRef.current = glKey;
          readyNotifiedRef.current = false;
          setContextVersion((version) => version + 1);
        } catch (error) {
          reportError(error);
        }
      },
      [disposeScene, fieldOfView, glKey, reportError, segments],
    );

    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        viewSizeRef.current = { width, height };
        sceneRef.current?.setViewSize(width, height);
        onLayout?.(event);
      },
      [onLayout],
    );

    /** Cena viva e criada para a foto atual (a GLView anterior pode ainda não ter morrido). */
    const currentScene = useCallback(
      () => (sceneRef.current && sceneKeyRef.current === glKey ? sceneRef.current : null),
      [glKey],
    );

    // Foto da pele
    useEffect(() => {
      const scene = currentScene();
      if (!scene) return;
      let cancelled = false;
      (async () => {
        try {
          const { image, temporario } = await resolverImagemLocal(skin.uri, skin);
          if (cancelled || scene !== currentScene()) {
            temporario?.delete();
            return;
          }
          try {
            scene.setSkin(image);
          } finally {
            temporario?.delete();
          }
          if (!readyNotifiedRef.current) {
            readyNotifiedRef.current = true;
            scene.renderNow();
            onReadyRef.current?.();
          }
        } catch (error) {
          if (!cancelled) reportError(error);
        }
      })();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skin.uri, skin.width, skin.height, contextVersion]);

    // Tatuagem
    useEffect(() => {
      const scene = currentScene();
      if (!scene) return;
      if (!tattoo) {
        scene.setTattoo(null);
        return;
      }
      let cancelled = false;
      (async () => {
        try {
          const { image, temporario } = await resolverImagemLocal(tattoo.uri, tattoo);
          if (cancelled || scene !== currentScene()) {
            temporario?.delete();
            return;
          }
          try {
            scene.setTattoo(image);
          } finally {
            temporario?.delete();
          }
        } catch (error) {
          if (!cancelled) reportError(error);
        }
      })();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tattoo?.uri, tattoo?.width, tattoo?.height, contextVersion]);

    // Depth map
    useEffect(() => {
      const scene = currentScene();
      if (!scene) return;
      try {
        scene.setDepthMap(depthMap);
      } catch (error) {
        reportError(error);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [depthMap, contextVersion]);

    // Parâmetros do shader
    useEffect(() => {
      const scene = currentScene();
      if (!scene) return;
      scene.setDisplacementScale(displacementScale);
      scene.setTattooOpacity(tattooOpacity);
      scene.setInkShading(inkShading);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displacementScale, tattooOpacity, inkShading, contextVersion]);

    // Libera tudo quando o componente sai da tela.
    useEffect(() => disposeScene, [disposeScene]);

    useImperativeHandle(
      ref,
      () => ({
        setTransform(partial) {
          transformRef.current = { ...transformRef.current, ...partial };
          sceneRef.current?.setTransform(partial);
        },
        getTransform() {
          return { ...transformRef.current };
        },
        resetTransform() {
          transformRef.current = { ...IDENTITY_TRANSFORM };
          sceneRef.current?.setTransform(IDENTITY_TRANSFORM);
        },
        async captureSnapshot({ format = 'jpeg', quality = 0.92, base64 = false } = {}) {
          const scene = sceneRef.current;
          const glView = glViewRef.current;
          if (!scene || !glView) {
            throw new Error('O canvas da simulação ainda não está pronto');
          }
          scene.renderNow();
          const snapshot = await glView.takeSnapshotAsync({ format, compress: quality });
          const uri = snapshot.localUri || (typeof snapshot.uri === 'string' ? snapshot.uri : null);
          if (!uri) {
            throw new Error('Não foi possível capturar o frame da simulação');
          }
          const result: SimulationSnapshot = { uri, width: snapshot.width, height: snapshot.height };
          if (base64) {
            result.base64 = await new File(uri).base64();
          }
          return result;
        },
      }),
      [],
    );

    return (
      <View {...viewProps} style={[{ width: '100%', aspectRatio }, style]} onLayout={handleLayout}>
        <GLView
          key={glKey}
          ref={glViewRef}
          style={StyleSheet.absoluteFill}
          onContextCreate={handleContextCreate}
          pointerEvents="none"
        />
      </View>
    );
  },
);
