// Liquid Gradient Animation with Three.js
// Adapted for Leadframe Studio Theme

class TouchTexture {
  constructor() {
    this.size = 64;
    this.width = this.height = this.size;
    this.maxAge = 64;
    this.radius = 0.15 * this.size;
    this.speed = 1 / this.maxAge;
    this.trail = [];
    this.last = null;
    this.initTexture();
  }

  initTexture() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
  }

  update() {
    this.clear();
    let speed = this.speed;
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const point = this.trail[i];
      let f = point.force * speed * (1 - point.age / this.maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f;
      point.age++;
      if (point.age > this.maxAge) {
        this.trail.splice(i, 1);
      } else {
        this.drawPoint(point);
      }
    }
    this.texture.needsUpdate = true;
  }

  clear() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addTouch(point) {
    let force = 0;
    let vx = 0;
    let vy = 0;
    const last = this.last;
    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      let d = Math.sqrt(dd);
      vx = dx / d;
      vy = dy / d;
      force = Math.min(dd * 10000, 1.0);
    }
    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  drawPoint(point) {
    const pos = {
      x: point.x * this.width,
      y: (1 - point.y) * this.height,
    };

    let intensity = 1;
    if (point.age < this.maxAge * 0.3) {
      intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
    } else {
      const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
      intensity = -t * (t - 2);
    }
    intensity *= point.force;

    const radius = this.radius;
    let color = `${((point.vx + 1) / 2) * 255}, ${
      ((point.vy + 1) / 2) * 255
    }, ${intensity * 255}`;
    let offset = this.size * 5;
    this.ctx.shadowOffsetX = offset;
    this.ctx.shadowOffsetY = offset;
    this.ctx.shadowBlur = radius * 1;
    this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;

    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255,0,0,1)";
    this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

class GradientBackground {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.mesh = null;

    // Theme Colors
    // Primary: #7c3aed (Violet 600) -> 0.486, 0.227, 0.929
    // Dark: #6d28d9 (Violet 700) -> 0.427, 0.157, 0.851
    // Accent: #4f46e5 (Indigo 600) -> 0.310, 0.275, 0.898
    // Light: #ddd6fe (Violet 200) -> 0.867, 0.839, 0.996

    // Theme Colors - Adjusted for Darker Contrast
    const colorPrimary = new THREE.Vector3(0.35, 0.1, 0.8); // Deep Violet
    const colorDark = new THREE.Vector3(0.2, 0.05, 0.5); // Darker Violet
    const colorIndigo = new THREE.Vector3(0.15, 0.15, 0.6); // Deep Indigo
    const colorLight = new THREE.Vector3(0.4, 0.3, 0.8); // Muted Light Violet (not too bright)

    this.uniforms = {
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uColor1: { value: colorPrimary },
      uColor2: { value: colorIndigo },
      uColor3: { value: colorLight },
      uColor4: { value: colorDark },
      uColor5: { value: colorPrimary },
      uColor6: { value: colorIndigo },
      uSpeed: { value: 0.6 }, // Slower for elegance
      uIntensity: { value: 1.1 }, // Reduced intensity
      uTouchTexture: { value: null },
      uGrainIntensity: { value: 0.08 }, // Reduced grain
      uDarkNavy: { value: new THREE.Vector3(0.02, 0.04, 0.1) }, // Very Dark Slate Base
      uGradientSize: { value: 0.55 },
      uColor1Weight: { value: 0.7 },
      uColor2Weight: { value: 0.7 },
    };
  }

  init() {
    const viewSize = this.sceneManager.getViewSize();
    const geometry = new THREE.PlaneGeometry(
      viewSize.width,
      viewSize.height,
      1,
      1,
    );

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
            varying vec2 vUv;
            void main() {
              vec3 pos = position.xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
              vUv = uv;
            }
          `,
      fragmentShader: `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec3 uColor4;
            uniform vec3 uColor5;
            uniform vec3 uColor6;
            uniform float uSpeed;
            uniform float uIntensity;
            uniform sampler2D uTouchTexture;
            uniform float uGrainIntensity;
            uniform vec3 uDarkNavy;
            uniform float uGradientSize;
            uniform float uColor1Weight;
            uniform float uColor2Weight;
            
            varying vec2 vUv;
            
            float grain(vec2 uv, float time) {
              vec2 grainUv = uv * uResolution * 0.5;
              float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
              return grainValue * 2.0 - 1.0;
            }
            
            vec3 getGradientColor(vec2 uv, float time) {
              float gradientRadius = uGradientSize;
              
              vec2 center1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
              vec2 center2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
              vec2 center3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
              vec2 center4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
              vec2 center5 = vec2(0.5 + sin(time * uSpeed * 0.7) * 0.35, 0.5 + cos(time * uSpeed * 0.6) * 0.35);
              vec2 center6 = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5, 0.5 + sin(time * uSpeed * 0.65) * 0.5);
              
              float dist1 = length(uv - center1);
              float dist2 = length(uv - center2);
              float dist3 = length(uv - center3);
              float dist4 = length(uv - center4);
              float dist5 = length(uv - center5);
              float dist6 = length(uv - center6);
              
              float influence1 = 1.0 - smoothstep(0.0, gradientRadius, dist1);
              float influence2 = 1.0 - smoothstep(0.0, gradientRadius, dist2);
              float influence3 = 1.0 - smoothstep(0.0, gradientRadius, dist3);
              float influence4 = 1.0 - smoothstep(0.0, gradientRadius, dist4);
              float influence5 = 1.0 - smoothstep(0.0, gradientRadius, dist5);
              float influence6 = 1.0 - smoothstep(0.0, gradientRadius, dist6);
              
              vec3 color = vec3(0.0);
              color += uColor1 * influence1 * (0.6 + 0.4 * sin(time * uSpeed));
              color += uColor2 * influence2 * (0.6 + 0.4 * cos(time * uSpeed * 1.2));
              color += uColor3 * influence3 * (0.6 + 0.4 * sin(time * uSpeed * 0.8));
              color += uColor4 * influence4 * (0.6 + 0.4 * cos(time * uSpeed * 1.3));
              color += uColor5 * influence5 * (0.6 + 0.4 * sin(time * uSpeed * 1.1));
              color += uColor6 * influence6 * (0.6 + 0.4 * cos(time * uSpeed * 0.9));
              
              color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;
              
              // Stronger Base Mix used to ensure dark background
              float brightness = length(color);
              float mixFactor = clamp(brightness * 0.8, 0.0, 0.85); // Cap cloudiness to 85%
              color = mix(uDarkNavy, color, mixFactor);
              
              return color;
            }
            
            void main() {
              vec2 uv = vUv;
              
              vec4 touchTex = texture2D(uTouchTexture, uv);
              float vx = -(touchTex.r * 2.0 - 1.0);
              float vy = -(touchTex.g * 2.0 - 1.0);
              float intensity = touchTex.b;
              uv.x += vx * 0.5 * intensity;
              uv.y += vy * 0.5 * intensity;
              
              // Combined ripple
              vec2 center = vec2(0.5);
              float dist = length(uv - center);
              float ripple = sin(dist * 15.0 - uTime * 2.0) * 0.02 * intensity;
              uv += vec2(ripple);
              
              vec3 color = getGradientColor(uv, uTime);
              
              float grainValue = grain(uv, uTime);
              color += grainValue * uGrainIntensity;
              
              gl_FragColor = vec4(color, 1.0);
            }
          `,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.sceneManager.scene.add(this.mesh);
  }

  update(delta) {
    if (this.uniforms.uTime) {
      this.uniforms.uTime.value += delta;
    }
  }

  onResize(width, height) {
    const viewSize = this.sceneManager.getViewSize();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(
        viewSize.width,
        viewSize.height,
        1,
        1,
      );
    }
    if (this.uniforms.uResolution) {
      this.uniforms.uResolution.value.set(width, height);
    }
  }
}

class LiquidGradientAnimation {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });

    this.updateSize();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      1000,
    );
    this.camera.position.z = 50;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Slate 900 base

    this.clock = new THREE.Clock();
    this.touchTexture = new TouchTexture();
    this.gradientBackground = new GradientBackground(this);
    this.gradientBackground.uniforms.uTouchTexture.value =
      this.touchTexture.texture;

    this.gradientBackground.init();

    this.initEvents();
    this.tick();
  }

  updateSize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.renderer.setSize(this.width, this.height);
  }

  initEvents() {
    window.addEventListener("resize", () => this.onResize());
    // Attach mouse move to the container for better localized tracking
    this.container.addEventListener("mousemove", (ev) => this.onMouseMove(ev));
    this.container.addEventListener("touchmove", (ev) => this.onTouchMove(ev));
  }

  onMouseMove(ev) {
    // Get mouse position relative to container
    const rect = this.container.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    this.mouse = {
      x: x / this.width,
      y: 1 - y / this.height,
    };
    this.touchTexture.addTouch(this.mouse);
  }

  onTouchMove(ev) {
    const touch = ev.touches[0];
    const rect = this.container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY }); // This might be slightly off due to recursion if direct call, but onMouseMove calculates from clientX/Y again.
    // Let's manually trigger to reuse logic or just pass relative coords.
    // Easier:
    this.mouse = {
      x: x / this.width,
      y: 1 - y / this.height,
    };
    this.touchTexture.addTouch(this.mouse);
  }

  getViewSize() {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      this.camera.position.z * Math.tan(fovInRadians / 2) * 2,
    );
    return { width: height * this.camera.aspect, height };
  }

  update(delta) {
    this.touchTexture.update();
    this.gradientBackground.update(delta);
  }

  render() {
    const delta = this.clock.getDelta();
    this.renderer.render(this.scene, this.camera);
    this.update(delta);
  }

  tick() {
    this.render();
    requestAnimationFrame(() => this.tick());
  }

  onResize() {
    this.updateSize();
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.gradientBackground.onResize(this.width, this.height);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  new LiquidGradientAnimation("hero-canvas-container");
  new LiquidGradientAnimation("value-canvas-container");
  new LiquidGradientAnimation("contact-canvas-container");
});
