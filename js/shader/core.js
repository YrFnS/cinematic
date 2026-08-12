export const shaderCore = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uProgress;
uniform float uVelocity;
uniform float uReducedMotion;
uniform float uQuality;

#define PI 3.141592653589793
#define TAU 6.283185307179586

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

float hash21(vec2 value) {
  value = fract(value * vec2(123.34, 456.21));
  value += dot(value, value + 45.32);
  return fract(value.x * value.y);
}

float noise2(vec2 value) {
  vec2 index = floor(value);
  vec2 fraction = fract(value);
  fraction = fraction * fraction * (3.0 - 2.0 * fraction);

  float a = hash21(index);
  float b = hash21(index + vec2(1.0, 0.0));
  float c = hash21(index + vec2(0.0, 1.0));
  float d = hash21(index + vec2(1.0, 1.0));

  return mix(mix(a, b, fraction.x), mix(c, d, fraction.x), fraction.y);
}

float fbm(vec2 value) {
  float result = 0.0;
  float amplitude = 0.52;
  mat2 warp = mat2(0.80, -0.60, 0.60, 0.80);

  for (int octave = 0; octave < 5; octave++) {
    result += amplitude * noise2(value);
    value = warp * value * 2.03 + 19.17;
    amplitude *= 0.48;
  }

  return result;
}

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

float chapterWeight(float progress, float center, float width) {
  float distanceToCenter = abs(progress - center);
  return 1.0 - smoothstep(width * 0.42, width, distanceToCenter);
}

vec3 colorViolet() { return vec3(0.56, 0.43, 1.20); }
vec3 colorCyan() { return vec3(0.34, 1.08, 1.35); }
vec3 colorEmber() { return vec3(1.32, 0.43, 0.20); }
vec3 colorIvory() { return vec3(1.30, 1.22, 1.06); }

vec3 starLayer(vec2 uv, float scale, float seed, float timeOffset) {
  vec2 cellSpace = uv * scale;
  vec2 cell = floor(cellSpace);
  vec2 local = fract(cellSpace) - 0.5;
  float randomValue = hash21(cell + seed);
  vec2 pointOffset = vec2(
    hash21(cell + seed + 17.3),
    hash21(cell + seed + 41.7)
  ) - 0.5;
  pointOffset *= 0.72;

  float distanceToPoint = length(local - pointOffset);
  float core = 1.0 - smoothstep(0.0, 0.075, distanceToPoint);
  core = pow(core, 5.0) * step(0.955, randomValue);

  float pulse = 0.72 + 0.28 * sin(timeOffset * (0.7 + randomValue * 1.8) + randomValue * 31.0);
  float spectral = hash21(cell + seed + 91.0);
  vec3 tint = mix(vec3(0.62, 0.72, 1.0), vec3(1.0, 0.72, 0.60), spectral);
  return tint * core * pulse;
}

vec3 starField(vec2 uv, float timeValue) {
  vec3 result = vec3(0.0);
  result += starLayer(uv + vec2(timeValue * 0.0015, 0.0), 18.0, 3.0, timeValue) * 0.65;
  result += starLayer(uv * rotate2d(0.28) - vec2(0.0, timeValue * 0.0008), 33.0, 19.0, timeValue) * 0.46;
  result += starLayer(uv * rotate2d(-0.19), 58.0, 47.0, timeValue) * 0.32;
  return result;
}

vec3 nebula(vec2 uv, float timeValue, vec3 tintA, vec3 tintB) {
  float large = fbm(uv * 1.12 + vec2(timeValue * 0.006, -timeValue * 0.004));
  float small = fbm(uv * 2.7 - vec2(timeValue * 0.003, timeValue * 0.006));
  float cloud = smoothstep(0.36, 0.93, large * 0.78 + small * 0.42);
  float hollow = 1.0 - smoothstep(0.0, 1.22, length(uv * vec2(0.78, 1.0)));
  return mix(tintA, tintB, small) * cloud * hollow;
}

`;
