/**
 * Shaders da simulação de tatuagem (GLSL ES 1.00 — o three.js converte para 3.00 ao compilar).
 *
 * Vertex: desloca cada vértice do plano ao longo de +Z proporcionalmente ao depth map
 * (displacement mapping). O plano tem 2 unidades de altura e `2 * aspecto` de largura, centrado
 * na origem; a câmera olha para ele de frente, então "perto da câmera" (depth = 1) sai do plano
 * em direção ao usuário.
 *
 * Fragment: a foto da pele é a cor base. A tatuagem é projetada sobre o plano em coordenadas de
 * "altura da foto" (y em [0, 1], x em [0, aspecto]) com translação, rotação e escala, e fundida
 * em modo Multiply — o pigmento escurece a pele, herdando sombras e textura da foto. Um termo de
 * sombreamento calculado a partir da normal do depth map (gradiente por diferenças centrais)
 * escurece o pigmento onde a superfície se afasta da luz, para o relevo ser perceptível mesmo
 * com a câmera parada.
 */

export const TATTOO_VERTEX_SHADER = /* glsl */ `
  uniform highp sampler2D uDepthMap;
  uniform float uHasDepth;
  uniform float uDisplacementScale;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    float depth = uHasDepth > 0.5 ? texture2D(uDepthMap, uv).r : 0.0;
    vec3 displaced = position + vec3(0.0, 0.0, depth * uDisplacementScale);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const TATTOO_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uSkinMap;
  uniform highp sampler2D uDepthMap;
  uniform sampler2D uTattooMap;

  uniform float uHasDepth;
  uniform float uHasTattoo;
  uniform float uDisplacementScale;
  // 1 / resolução do depth map, em UV
  uniform vec2 uDepthTexel;
  // tamanho do plano em unidades de mundo (largura, altura)
  uniform vec2 uPlaneSize;
  // largura / altura da foto
  uniform float uAspect;

  // Posição da tatuagem em "unidades de altura da foto": x em [0, aspecto], y em [0, 1], y para cima
  uniform vec2 uTattooCenter;
  uniform vec2 uTattooHalfSize;
  // radianos; positivo = sentido horário na tela (convenção do RN, y para baixo)
  uniform float uTattooRotation;
  uniform float uTattooOpacity;
  // 0 = só multiply; 1 = sombreamento pela normal em força total
  uniform float uInkShading;
  uniform vec3 uLightDir;

  varying vec2 vUv;

  vec3 surfaceNormal(vec2 uv) {
    if (uHasDepth < 0.5) {
      return vec3(0.0, 0.0, 1.0);
    }
    float left = texture2D(uDepthMap, uv - vec2(uDepthTexel.x, 0.0)).r;
    float right = texture2D(uDepthMap, uv + vec2(uDepthTexel.x, 0.0)).r;
    float bottom = texture2D(uDepthMap, uv - vec2(0.0, uDepthTexel.y)).r;
    float top = texture2D(uDepthMap, uv + vec2(0.0, uDepthTexel.y)).r;
    // dz/dx em unidades de mundo: a diferença cobre 2 texels do depth map
    float dzdx = (right - left) * uDisplacementScale / (2.0 * uDepthTexel.x * uPlaneSize.x);
    float dzdy = (top - bottom) * uDisplacementScale / (2.0 * uDepthTexel.y * uPlaneSize.y);
    return normalize(vec3(-dzdx, -dzdy, 1.0));
  }

  void main() {
    vec3 color = texture2D(uSkinMap, vUv).rgb;

    if (uHasTattoo > 0.5) {
      vec2 p = vec2(vUv.x * uAspect, vUv.y);
      vec2 d = p - uTattooCenter;
      // Rotação horária na tela (y para baixo) = anti-horária neste espaço (y para cima):
      // para achar a coordenada local do decalque aplica-se R(+ângulo) ao deslocamento.
      float c = cos(uTattooRotation);
      float s = sin(uTattooRotation);
      vec2 local = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
      vec2 tattooUv = local / (2.0 * uTattooHalfSize) + 0.5;

      // Amostra sempre (fora do if) para as derivadas do mipmap ficarem bem definidas na borda.
      vec4 ink = texture2D(uTattooMap, clamp(tattooUv, 0.0, 1.0));
      float inside = step(0.0, tattooUv.x) * step(tattooUv.x, 1.0) * step(0.0, tattooUv.y) * step(tattooUv.y, 1.0);

      vec3 normal = surfaceNormal(vUv);
      float diffuse = max(dot(normal, uLightDir), 0.0);
      float flatResponse = max(uLightDir.z, 0.0);
      // Normalizado para a superfície plana não mudar de tom: só a curvatura altera o pigmento.
      float shade = mix(1.0, (0.35 + 0.65 * diffuse) / (0.35 + 0.65 * flatResponse), uInkShading);

      float alpha = ink.a * uTattooOpacity * inside;
      color *= mix(vec3(1.0), ink.rgb * shade, alpha);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
