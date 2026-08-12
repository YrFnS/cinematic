export const shaderScenesB = `float terrainHeight(vec2 point) {
  float broad = sin(point.x * 0.72 + sin(point.y * 0.18) * 1.4) * 0.16;
  float crossWave = sin(point.y * 0.48 - point.x * 0.25) * 0.12;
  float detail = (noise2(point * 0.19) - 0.5) * 0.46;
  detail += (noise2(point * 0.47 + 11.3) - 0.5) * 0.12;
  return -0.72 + broad + crossWave + detail;
}

vec3 terrainNormal(vec3 point) {
  float epsilon = 0.025;
  float centerHeight = terrainHeight(point.xz);
  float xHeight = terrainHeight(point.xz + vec2(epsilon, 0.0));
  float zHeight = terrainHeight(point.xz + vec2(0.0, epsilon));
  return normalize(vec3(centerHeight - xHeight, epsilon, centerHeight - zHeight));
}

mat3 cameraMatrix(vec3 origin, vec3 target, float roll) {
  vec3 forward = normalize(target - origin);
  vec3 rollAxis = vec3(sin(roll), cos(roll), 0.0);
  vec3 right = normalize(cross(forward, rollAxis));
  vec3 up = normalize(cross(right, forward));
  return mat3(right, up, forward);
}

vec3 sceneMemory(vec2 uv, float progress, float timeValue) {
  float localProgress = saturate((progress - 0.45) / 0.31);
  float motionTime = mix(timeValue, 0.0, uReducedMotion);
  vec3 origin = vec3(
    sin(localProgress * 1.65) * 1.45,
    1.12 + sin(localProgress * PI) * 0.42,
    4.8 - localProgress * 8.4
  );
  vec3 target = vec3(
    sin(localProgress * 0.7) * 0.55,
    -0.35,
    -4.5 - localProgress * 4.0
  );
  mat3 camera = cameraMatrix(origin, target, sin(localProgress * PI) * 0.035);
  vec3 rayDirection = camera * normalize(vec3(uv, 1.46));

  vec3 sunDirection = normalize(vec3(-0.36, 0.27, -0.89));
  float sunAmount = max(dot(rayDirection, sunDirection), 0.0);
  float skyHeight = saturate(rayDirection.y * 0.5 + 0.5);
  vec3 sky = mix(vec3(0.006, 0.008, 0.025), vec3(0.035, 0.070, 0.13), skyHeight);
  sky += colorEmber() * pow(sunAmount, 220.0) * 1.25;
  sky += colorViolet() * pow(sunAmount, 12.0) * 0.075;
  sky += nebula(rayDirection.xy * 1.4, motionTime, vec3(0.08, 0.02, 0.14), vec3(0.02, 0.09, 0.13)) * 0.18;
  sky += starField(rayDirection.xy * 0.9, motionTime) * (1.0 - skyHeight) * 0.34;

  float travelDistance = 0.12;
  float hit = 0.0;
  vec3 point = origin;

  for (int stepIndex = 0; stepIndex < 48; stepIndex++) {
    if (uQuality < 0.5 && stepIndex > 32) {
      break;
    }
    point = origin + rayDirection * travelDistance;
    float heightDifference = point.y - terrainHeight(point.xz);
    if (heightDifference < 0.0025 * travelDistance + 0.0015) {
      hit = 1.0;
      break;
    }
    travelDistance += max(0.026, heightDifference * 0.39);
    if (travelDistance > 25.0) {
      break;
    }
  }

  vec3 color = sky;
  if (hit > 0.5) {
    vec3 normal = terrainNormal(point);
    float diffuse = max(dot(normal, normalize(vec3(-0.42, 0.74, 0.48))), 0.0);
    float rim = pow(1.0 - max(dot(normal, -rayDirection), 0.0), 3.0);
    float heightColor = saturate((point.y + 1.0) * 0.75);
    vec3 ground = mix(vec3(0.018, 0.018, 0.045), vec3(0.08, 0.045, 0.15), heightColor);
    ground += colorCyan() * diffuse * 0.075;
    ground += colorViolet() * rim * 0.16;

    vec2 gridPoint = point.xz * 0.64;
    float gridX = 1.0 - smoothstep(0.0, 0.052, abs(sin(gridPoint.x * PI)));
    float gridZ = 1.0 - smoothstep(0.0, 0.052, abs(sin(gridPoint.y * PI)));
    float grid = max(gridX, gridZ) * smoothstep(15.0, 1.0, travelDistance);
    ground += mix(colorViolet(), colorCyan(), heightColor) * grid * 0.28;

    float contour = 1.0 - smoothstep(0.0, 0.08, abs(sin(point.y * 22.0)));
    ground += colorIvory() * contour * 0.035;

    float fog = exp(-travelDistance * 0.092);
    color = mix(sky, ground, fog);
  }

  float horizonGlow = pow(1.0 - abs(rayDirection.y + 0.045), 16.0);
  color += mix(colorViolet(), colorEmber(), localProgress) * horizonGlow * 0.035;
  return color;
}

float archLine(vec2 point, float width, float height, float thickness, out float glowDistance) {
  float topDistance = abs(length(point) - width);
  float topMask = step(0.0, point.y);
  float sideDistance = abs(abs(point.x) - width);
  float sideMask = step(-height, point.y) * step(point.y, 0.0);
  float distanceToArch = min(
    mix(999.0, topDistance, topMask),
    mix(999.0, sideDistance, sideMask)
  );
  glowDistance = distanceToArch;
  return 1.0 - smoothstep(thickness, thickness * 2.8, distanceToArch);
}

vec3 sceneDirection(vec2 uv, float progress, float timeValue) {
  float localProgress = saturate((progress - 0.65) / 0.30);
  vec2 q = uv;
  q *= rotate2d((localProgress - 0.5) * 0.18);
  q.x += sin(timeValue * 0.09) * 0.018 * (1.0 - uReducedMotion);

  vec3 color = vec3(0.003, 0.003, 0.009);
  color += nebula(q * 0.8, timeValue, vec3(0.05, 0.01, 0.13), vec3(0.01, 0.09, 0.13)) * 0.21;
  color += starField(q * 0.82, timeValue) * 0.22;

  for (int archIndex = 0; archIndex < 8; archIndex++) {
    float index = float(archIndex);
    float depth = fract(index / 8.0 + localProgress * 0.72 + timeValue * 0.006);
    float scale = mix(0.48, 3.45, depth);
    vec2 archPoint = q * scale;
    archPoint.y += 0.12 + depth * 0.20;
    archPoint.x += sin(index * 2.4 + localProgress * 4.0) * 0.08 * depth;

    float glowDistance = 0.0;
    float lineValue = archLine(archPoint, 0.54, 0.96, 0.008 * scale, glowDistance);
    float softGlow = 1.0 - smoothstep(0.012 * scale, 0.09 * scale, glowDistance);
    float fade = smoothstep(0.0, 0.16, depth) * (1.0 - smoothstep(0.86, 1.0, depth));
    vec3 archColor = mix(colorViolet(), colorCyan(), 0.5 + 0.5 * sin(index * 1.73));
    color += archColor * lineValue * fade * 0.58;
    color += archColor * softGlow * fade * 0.055;
  }

  float ribbonOne = abs(q.y - 0.24 * sin(q.x * 2.7 + localProgress * 5.4 + timeValue * 0.12));
  float ribbonTwo = abs(q.y + 0.20 * sin(q.x * 3.3 - localProgress * 4.1 - timeValue * 0.09));
  float ribbonMaskOne = 1.0 - smoothstep(0.0, 0.008, ribbonOne);
  float ribbonMaskTwo = 1.0 - smoothstep(0.0, 0.006, ribbonTwo);
  float ribbonGlow = 1.0 - smoothstep(0.0, 0.07, min(ribbonOne, ribbonTwo));
  color += colorIvory() * ribbonMaskOne * 0.34;
  color += colorCyan() * ribbonMaskTwo * 0.25;
  color += colorViolet() * ribbonGlow * 0.045;

  float floorLine = 1.0 - smoothstep(0.0, 0.009, abs(q.y + 0.84));
  color += mix(colorViolet(), colorEmber(), localProgress) * floorLine * 0.32;
  return color;
}

vec3 sceneHorizon(vec2 uv, float progress, float timeValue) {
  float localProgress = saturate((progress - 0.82) / 0.18);
  vec2 q = uv;
  q.y += 0.17 - localProgress * 0.07;

  vec3 color = mix(vec3(0.004, 0.004, 0.012), vec3(0.015, 0.009, 0.023), localProgress);
  color += nebula(uv * 0.72, timeValue, vec3(0.08, 0.015, 0.12), vec3(0.015, 0.08, 0.12)) * 0.16;
  color += starField(uv * 0.74, timeValue) * (1.0 - localProgress * 0.7) * 0.25;

  float sunRadius = mix(0.12, 0.30, smoothstep(0.0, 1.0, localProgress));
  float sunDistance = length(q * vec2(1.0, 1.0));
  float sun = 1.0 - smoothstep(sunRadius * 0.94, sunRadius, sunDistance);
  float corona = 0.016 / (abs(sunDistance - sunRadius) + 0.018);
  float outerGlow = exp(-sunDistance * 3.2) * (0.42 + localProgress * 0.38);

  float rayAngle = atan(q.y, q.x);
  float rayNoise = fbm(vec2(rayAngle * 2.3, sunDistance * 2.0 - timeValue * 0.015));
  float rays = pow(max(0.0, rayNoise - 0.44), 2.0) * exp(-sunDistance * 1.85);

  vec3 sunColor = mix(colorEmber(), colorIvory(), smoothstep(0.0, 0.75, localProgress));
  color += sunColor * sun * 1.15;
  color += mix(colorEmber(), colorViolet(), 0.42) * corona * 0.13;
  color += colorEmber() * outerGlow * 0.21;
  color += colorIvory() * rays * 0.12;

  float horizonY = -0.17;
  float horizon = 1.0 - smoothstep(0.0, 0.009, abs(uv.y - horizonY));
  color += colorIvory() * horizon * 0.28;

  float belowHorizon = step(uv.y, horizonY);
  float reflectionWidth = mix(0.22, 0.065, saturate((horizonY - uv.y) * 1.2));
  float reflection = exp(-abs(uv.x) / max(reflectionWidth, 0.025));
  reflection *= exp(-(horizonY - uv.y) * 2.1) * belowHorizon;
  reflection *= 0.55 + 0.45 * sin((horizonY - uv.y) * 130.0 + noise2(uv * 19.0) * 5.0);
  color += sunColor * reflection * 0.19;

  float convergence = exp(-abs(uv.x) * 19.0) * exp(-abs(uv.y - horizonY) * 2.8);
  color += colorCyan() * convergence * (1.0 - localProgress) * 0.06;
  return color;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
  float timeValue = mix(uTime, 0.0, uReducedMotion);
  float progress = saturate(uProgress);

  vec2 pointerOffset = uPointer * 0.055 * (1.0 - uReducedMotion);
  uv += pointerOffset * (0.55 + 0.45 * (1.0 - length(uv)));

  float w0 = chapterWeight(progress, 0.00, 0.22);
  float w1 = chapterWeight(progress, 0.19, 0.215);
  float w2 = chapterWeight(progress, 0.39, 0.215);
  float w3 = chapterWeight(progress, 0.59, 0.215);
  float w4 = chapterWeight(progress, 0.79, 0.215);
  float w5 = chapterWeight(progress, 1.00, 0.22);
  float weightSum = max(0.0001, w0 + w1 + w2 + w3 + w4 + w5);

  vec3 color = vec3(0.0);
  if (w0 > 0.0001) color += sceneSignal(uv, progress, timeValue) * w0;
  if (w1 > 0.0001) color += sceneAwaken(uv, progress, timeValue) * w1;
  if (w2 > 0.0001) color += scenePassage(uv, progress, timeValue) * w2;
  if (w3 > 0.0001) color += sceneMemory(uv, progress, timeValue) * w3;
  if (w4 > 0.0001) color += sceneDirection(uv, progress, timeValue) * w4;
  if (w5 > 0.0001) color += sceneHorizon(uv, progress, timeValue) * w5;
  color /= weightSum;

  float transitionFlash = 0.0;
  transitionFlash += exp(-pow((progress - 0.105) / 0.032, 2.0));
  transitionFlash += exp(-pow((progress - 0.305) / 0.030, 2.0));
  transitionFlash += exp(-pow((progress - 0.505) / 0.032, 2.0));
  transitionFlash += exp(-pow((progress - 0.705) / 0.032, 2.0));
  transitionFlash += exp(-pow((progress - 0.905) / 0.034, 2.0));
  color += mix(colorViolet(), colorCyan(), progress) * transitionFlash * (0.012 + abs(uVelocity) * 0.018);

  float vignette = 1.0 - smoothstep(0.38, 1.42, length(uv * vec2(0.78, 1.0)));
  color *= 0.36 + vignette * 0.64;

  float scanline = 0.985 + 0.015 * sin(gl_FragCoord.y * 1.65);
  color *= scanline;

  float grain = hash21(gl_FragCoord.xy + floor(timeValue * 60.0)) - 0.5;
  color += grain * (0.018 + 0.005 * uQuality);

  color = max(color, vec3(0.0));
  color = vec3(1.0) - exp(-color * 1.16);
  color = pow(color, vec3(0.93));

  fragColor = vec4(color, 1.0);
}
`;
