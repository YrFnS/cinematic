import { fragmentShader, vertexShader } from "./shaders.js";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate a WebGL shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to allocate a WebGL program.");

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Unknown shader link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function detectDeviceTier(reducedMotion) {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const narrow = window.innerWidth < 760;
  const lowPower = reducedMotion || cores <= 4 || memory <= 4 || (coarsePointer && narrow);

  return {
    lowPower,
    targetFps: reducedMotion ? 12 : lowPower ? 30 : 60,
    qualityUniform: lowPower ? 0 : 1,
    maximumPixels: lowPower ? 850_000 : 2_100_000,
    baseScale: lowPower ? 0.72 : 0.92,
    maximumDpr: lowPower ? 1 : 1.28,
  };
}

export class CinematicRenderer {
  constructor(canvas, { reducedMotion = false, onReady, onFailure } = {}) {
    this.canvas = canvas;
    this.reducedMotion = reducedMotion;
    this.onReady = onReady;
    this.onFailure = onFailure;
    this.deviceTier = detectDeviceTier(reducedMotion);

    this.targetProgress = 0;
    this.currentProgress = 0;
    this.targetPointer = { x: 0, y: 0 };
    this.currentPointer = { x: 0, y: 0 };
    this.targetVelocity = 0;
    this.currentVelocity = 0;
    this.dynamicScale = 1;
    this.active = true;
    this.destroyed = false;
    this.hasRendered = false;
    this.lastFrameTime = 0;
    this.startTime = performance.now();
    this.slowFrames = 0;
    this.fastFrames = 0;

    this.handleResize = this.handleResize.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);
    this.handleContextLost = this.handleContextLost.bind(this);
    this.handleContextRestored = this.handleContextRestored.bind(this);
    this.render = this.render.bind(this);

    try {
      this.initialize();
    } catch (error) {
      this.fail(error);
      return;
    }

    window.addEventListener("resize", this.handleResize, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibility);
    canvas.addEventListener("webglcontextlost", this.handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", this.handleContextRestored, false);

    this.handleResize();
    this.animationFrame = requestAnimationFrame(this.render);
  }

  initialize() {
    const gl = this.canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      desynchronized: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) throw new Error("WebGL 2 is unavailable.");

    this.gl = gl;
    this.program = createProgram(gl);
    gl.useProgram(this.program);

    const vertices = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]);

    this.vertexBuffer = gl.createBuffer();
    if (!this.vertexBuffer) throw new Error("Unable to allocate the fullscreen geometry.");

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const position = gl.getAttribLocation(this.program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, "uResolution"),
      pointer: gl.getUniformLocation(this.program, "uPointer"),
      time: gl.getUniformLocation(this.program, "uTime"),
      progress: gl.getUniformLocation(this.program, "uProgress"),
      velocity: gl.getUniformLocation(this.program, "uVelocity"),
      reducedMotion: gl.getUniformLocation(this.program, "uReducedMotion"),
      quality: gl.getUniformLocation(this.program, "uQuality"),
    };

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0.019, 0.019, 0.035, 1);
  }

  fail(error) {
    console.error("AETHER renderer failed:", error);
    this.destroyed = true;
    this.onFailure?.(error);
  }

  setProgress(progress, velocity = 0) {
    this.targetProgress = clamp(progress);
    this.targetVelocity = clamp(velocity, -2.5, 2.5);
  }

  setPointer(x, y) {
    this.targetPointer.x = clamp(x, -1, 1);
    this.targetPointer.y = clamp(y, -1, 1);
  }

  handleResize() {
    if (!this.gl || this.destroyed) return;

    const cssWidth = Math.max(1, window.innerWidth);
    const cssHeight = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, this.deviceTier.maximumDpr);
    let scale = this.deviceTier.baseScale * this.dynamicScale;

    const requestedPixels = cssWidth * cssHeight * dpr * dpr * scale * scale;
    if (requestedPixels > this.deviceTier.maximumPixels) {
      scale *= Math.sqrt(this.deviceTier.maximumPixels / requestedPixels);
    }

    const width = Math.max(1, Math.round(cssWidth * dpr * scale));
    const height = Math.max(1, Math.round(cssHeight * dpr * scale));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  handleVisibility() {
    this.active = !document.hidden;
    if (this.active) {
      this.lastFrameTime = performance.now();
    }
  }

  handleContextLost(event) {
    event.preventDefault();
    this.active = false;
  }

  handleContextRestored() {
    try {
      this.initialize();
      this.handleResize();
      this.active = true;
    } catch (error) {
      this.fail(error);
    }
  }

  adaptResolution(frameDelta) {
    if (this.reducedMotion || this.deviceTier.lowPower) return;

    if (frameDelta > 31) {
      this.slowFrames += 1;
      this.fastFrames = 0;
    } else if (frameDelta < 18) {
      this.fastFrames += 1;
      this.slowFrames = Math.max(0, this.slowFrames - 1);
    } else {
      this.slowFrames = Math.max(0, this.slowFrames - 1);
      this.fastFrames = Math.max(0, this.fastFrames - 1);
    }

    if (this.slowFrames > 75 && this.dynamicScale > 0.68) {
      this.dynamicScale = Math.max(0.68, this.dynamicScale - 0.12);
      this.slowFrames = 0;
      this.handleResize();
    } else if (this.fastFrames > 300 && this.dynamicScale < 1) {
      this.dynamicScale = Math.min(1, this.dynamicScale + 0.08);
      this.fastFrames = 0;
      this.handleResize();
    }
  }

  render(now) {
    if (this.destroyed) return;
    this.animationFrame = requestAnimationFrame(this.render);
    if (!this.active || !this.gl) return;

    const frameInterval = 1000 / this.deviceTier.targetFps;
    const elapsedSinceFrame = now - this.lastFrameTime;
    if (elapsedSinceFrame < frameInterval * 0.88) return;

    const deltaSeconds = Math.min(0.1, Math.max(0.001, elapsedSinceFrame / 1000));
    this.lastFrameTime = now;

    const progressEase = this.reducedMotion ? 1 : 1 - Math.exp(-deltaSeconds * 5.2);
    const pointerEase = this.reducedMotion ? 1 : 1 - Math.exp(-deltaSeconds * 3.4);
    const velocityEase = 1 - Math.exp(-deltaSeconds * 6.5);

    this.currentProgress += (this.targetProgress - this.currentProgress) * progressEase;
    this.currentPointer.x += (this.targetPointer.x - this.currentPointer.x) * pointerEase;
    this.currentPointer.y += (this.targetPointer.y - this.currentPointer.y) * pointerEase;
    this.currentVelocity += (this.targetVelocity - this.currentVelocity) * velocityEase;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniforms.pointer, this.currentPointer.x, this.currentPointer.y);
    gl.uniform1f(this.uniforms.time, (now - this.startTime) / 1000);
    gl.uniform1f(this.uniforms.progress, this.currentProgress);
    gl.uniform1f(this.uniforms.velocity, this.currentVelocity);
    gl.uniform1f(this.uniforms.reducedMotion, this.reducedMotion ? 1 : 0);
    gl.uniform1f(this.uniforms.quality, this.deviceTier.qualityUniform);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    this.targetVelocity *= 0.86;
    this.adaptResolution(elapsedSinceFrame);

    if (!this.hasRendered) {
      this.hasRendered = true;
      requestAnimationFrame(() => this.onReady?.());
    }
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);

    if (this.gl) {
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
      if (this.program) this.gl.deleteProgram(this.program);
    }
  }
}
