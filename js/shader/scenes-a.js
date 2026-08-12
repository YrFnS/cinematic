export const shaderScenesA = `vec3 sceneSignal(vec2 uv, float progress, float timeValue) {
  vec2 drifted = uv + vec2(sin(timeValue * 0.08), cos(timeValue * 0.06)) * 0.012;
  vec3 color = vec3(0.0028, 0.0032, 0.009);
  color += nebula(drifted, timeValue, vec3(0.08, 0.02, 0.19), vec3(0.02, 0.14, 0.22)) * 0.32;
  color += starField(drifted, timeValue) * 0.72;

  vec2 center = vec2(-0.02 + sin(timeValue * 0.12) * 0.008, 0.015);
  float distanceToSignal = length(uv - center);
  float pulse = 0.72 + 0.28 * sin(timeValue * 1.45);
  float signal = 0.012 / (distanceToSignal + 0.018);
  float halo = exp(-distanceToSignal * 9.0);
  float slit = exp(-abs(uv.x - center.x) * 165.0) * exp(-abs(uv.y - center.y) * 1.8);
  float echo = 1.0 - smoothstep(0.0, 0.012, abs(distanceToSignal - (0.105 + 0.012 * sin(timeValue * 0.7))));

  color += colorIvory() * signal * pulse * 0.12;
  color += colorViolet() * halo * 0.16;
  color += colorCyan() * slit * 0.18;
  color += colorViolet() * echo * 0.05;

  float reveal = smoothstep(0.0, 0.12, progress);
  color += colorCyan() * pow(max(0.0, 1.0 - distanceToSignal * 5.2), 9.0) * reveal * 0.1;
  return color;
}

vec3 sceneAwaken(vec2 uv, float progress, float timeValue) {
  float localProgress = saturate((progress - 0.04) / 0.30);
  float scale = mix(0.43, 1.66, smoothstep(0.25, 1.0, localProgress));
  vec2 center = vec2(
    mix(0.18, -0.02, smoothstep(0.0, 0.72, localProgress)),
    0.02 + sin(timeValue * 0.19) * 0.018
  );
  vec2 q = (uv - center) / scale;
  q *= rotate2d(timeValue * 0.018 - localProgress * 0.42);

  float radius = length(q);
  float angle = atan(q.y, q.x);
  float surfaceNoise = fbm(q * 3.35 + vec2(timeValue * 0.025, -timeValue * 0.017));
  float displacedRadius = radius + (surfaceNoise - 0.52) * 0.085;
  float inside = 1.0 - smoothstep(0.94, 1.015, displacedRadius);
  float edge = exp(-abs(displacedRadius - 0.986) * 58.0);

  float sphereZ = sqrt(max(0.0, 1.0 - radius * radius));
  vec3 normal = normalize(vec3(q, sphereZ));
  vec3 lightDirection = normalize(vec3(-0.48, 0.72, 0.82));
  float diffuse = max(dot(normal, lightDirection), 0.0);
  float fresnel = pow(1.0 - sphereZ, 3.3);
  float interference = 0.5 + 0.5 * sin(
    angle * 6.0 + surfaceNoise * 14.0 - timeValue * 0.55 + localProgress * 8.0
  );
  float veins = pow(0.5 + 0.5 * sin(surfaceNoise * 28.0 + angle * 9.0 - timeValue * 0.34), 12.0);

  vec3 material = mix(colorViolet(), colorCyan(), interference);
  material = mix(material, colorEmber(), pow(diffuse, 4.0) * 0.26);
  vec3 color = vec3(0.002, 0.003, 0.008);
  color += nebula(uv, timeValue, vec3(0.07, 0.02, 0.16), vec3(0.01, 0.10, 0.14)) * 0.24;
  color += starField(uv * 1.14, timeValue) * 0.32;
  color += material * inside * (0.095 + diffuse * 0.44 + fresnel * 0.58);
  color += colorIvory() * edge * (0.18 + fresnel * 0.75);
  color += colorCyan() * veins * inside * 0.15;

  float ringOne = exp(-abs(radius - 1.19) * 92.0);
  float ringTwo = exp(-abs(radius - 1.41) * 76.0);
  float dashOne = smoothstep(0.18, 0.88, 0.5 + 0.5 * sin(angle * 5.0 - timeValue * 0.68));
  float dashTwo = smoothstep(0.24, 0.92, 0.5 + 0.5 * sin(angle * 9.0 + timeValue * 0.43));
  color += colorCyan() * ringOne * dashOne * 0.52;
  color += colorViolet() * ringTwo * dashTwo * 0.32;

  float orbitGlow = 0.011 / (abs(radius - 1.19) + 0.018);
  color += mix(colorViolet(), colorCyan(), 0.5 + 0.5 * sin(angle * 3.0)) * orbitGlow * 0.02;

  float core = exp(-radius * 5.4) * inside;
  color += colorIvory() * core * (0.34 + 0.16 * sin(timeValue * 1.3));
  return color;
}

vec3 scenePassage(vec2 uv, float progress, float timeValue) {
  float localProgress = saturate((progress - 0.24) / 0.34);
  vec2 q = uv;
  q *= rotate2d(localProgress * 2.25 + timeValue * 0.025);
  q += uPointer * 0.025 * (1.0 - uReducedMotion);

  float radius = max(length(q), 0.025);
  float angle = atan(q.y, q.x);
  float inverseRadius = 0.43 / radius;
  float travel = localProgress * 44.0 + timeValue * 0.22;

  float ringCoordinate = inverseRadius * 6.4 + travel;
  float ringDistance = abs(fract(ringCoordinate * 0.145) - 0.5);
  float rings = 1.0 - smoothstep(0.0, 0.065, ringDistance);
  rings *= smoothstep(0.06, 0.82, radius);

  float ribCoordinate = angle / TAU * 14.0 + sin(ringCoordinate * 0.18) * 0.54;
  float ribDistance = abs(fract(ribCoordinate) - 0.5);
  float ribs = 1.0 - smoothstep(0.0, 0.044, ribDistance);
  ribs *= smoothstep(0.13, 1.12, radius);

  float filament = pow(0.5 + 0.5 * sin(angle * 4.0 - inverseRadius * 4.0 + travel * 0.42), 10.0);
  float centerVoid = exp(-radius * 7.8);
  float edgeEnergy = pow(saturate(radius), 2.0);
  float streak = pow(0.5 + 0.5 * sin(angle * 31.0 + travel * 0.95), 32.0) * edgeEnergy;

  vec3 color = vec3(0.0015, 0.002, 0.007);
  color += nebula(q * 0.75, timeValue, vec3(0.04, 0.01, 0.13), vec3(0.01, 0.11, 0.16)) * 0.22;
  color += mix(colorViolet(), colorCyan(), 0.5 + 0.5 * sin(angle * 2.0 + travel * 0.08)) * rings * 0.30;
  color += colorCyan() * ribs * (0.08 + rings * 0.22);
  color += colorViolet() * filament * 0.10;
  color += colorIvory() * streak * (0.05 + abs(uVelocity) * 0.08);
  color += colorCyan() * centerVoid * 0.08;

  float portalRim = exp(-abs(radius - mix(0.72, 0.14, localProgress)) * 54.0);
  color += colorIvory() * portalRim * 0.08;
  return color;
}

`;
