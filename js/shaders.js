import { shaderCore } from "./shader/core.js";
import { shaderScenesA } from "./shader/scenes-a.js";
import { shaderScenesB } from "./shader/scenes-b.js";

export const vertexShader = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const fragmentShader = `${shaderCore}${shaderScenesA}${shaderScenesB}`;
