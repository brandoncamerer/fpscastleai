// Global array to store clouds so we can update them later.
export const clouds = [];

export function initEnvironment(scene, getTerrainHeight) {
  // Ocean.
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.MeshLambertMaterial({ color: 0x1e90ff })
  );
  ocean.rotation.x = -Math.PI / 2;
  scene.add(ocean);

  // Island.
  // 1. Island Geometry (same as your original code)
const islandGeometry = new THREE.PlaneGeometry(500, 500, 25, 25);
islandGeometry.rotateX(-Math.PI / 2);
const posAttr = islandGeometry.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  let x = posAttr.getX(i);
  let z = posAttr.getZ(i);
  const r = Math.sqrt(x * x + z * z);
  if (r > 200) {
    const angle = Math.atan2(z, x);
    const t = Math.min((r - 200) / 50, 1);
    const shift = 5 * Math.sin(8 * angle) * t;
    x = x + shift * Math.cos(angle);
    z = z + shift * Math.sin(angle);
    posAttr.setX(i, x);
    posAttr.setZ(i, z);
  }
  const y = getTerrainHeight(x, z);
  posAttr.setY(i, y);
}
posAttr.needsUpdate = true;
islandGeometry.computeVertexNormals();

// 2. Create Grass Texture (same as your original code)
let cTex = document.createElement("canvas");
cTex.width = 256;
cTex.height = 256;
let ctx = cTex.getContext("2d");
ctx.fillStyle = "#4CAF50";
ctx.fillRect(0, 0, 256, 256);
for (let i = 0; i < 3000; i++) {
  const x = Math.random() * 256;
  const y = Math.random() * 256;
  const bladeHeight = Math.random() * 10 + 5;
  const angle = (Math.random() - 0.5) * 0.4;
  ctx.strokeStyle = "rgba(30,130,30," + (Math.random() * 0.5 + 0.5) + ")";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle) * bladeHeight, y - Math.sin(angle) * bladeHeight);
  ctx.stroke();
}
const grassTexture = new THREE.CanvasTexture(cTex);
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(25, 25);

// 3. Load Sand Texture
const sandTexture = new THREE.TextureLoader().load('path/to/sand_texture.jpg');
sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
sandTexture.repeat.set(25, 25);

// 4. Custom Shader Material to blend grass and sand
const islandMaterial = new THREE.ShaderMaterial({
  uniforms: {},
  vertexShader: `
    varying vec2 vUv;
    varying float vDistance;

    void main() {
      vUv = uv;
      vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vDistance = length(worldPos.xz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vDistance;

    // Quick hash noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      // Radial blend from grass to sand (200 to 250 range)
      float blend = smoothstep(200.0, 250.0, vDistance);

      // Procedural grass: green with noise-based variation
      vec3 grassColor = vec3(0.2, 0.6, 0.2);
      grassColor += 0.05 * noise(vUv * 100.0);

      // Procedural sand: soft tan with slight grain
      vec3 sandColor = vec3(0.94, 0.85, 0.55);
      sandColor += 0.03 * noise(vUv * 150.0);

      vec3 finalColor = mix(grassColor, sandColor, blend);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
});

// 5. Add Island Mesh with sandy edge blend
const islandMesh = new THREE.Mesh(islandGeometry, islandMaterial);
scene.add(islandMesh);

  // Sun and glow.
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(30, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd700 })
  );
  sun.position.set(200, 300, 100);
  scene.add(sun);

  let sGlow = document.createElement("canvas");
  sGlow.width = sGlow.height = 128;
  let gCtx = sGlow.getContext("2d");
  let grad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,223,0,1)");
  grad.addColorStop(0.5, "rgba(255,223,0,0.5)");
  grad.addColorStop(1, "rgba(255,223,0,0)");
  gCtx.fillStyle = grad;
  gCtx.fillRect(0, 0, 128, 128);

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(sGlow),
      blending: THREE.AdditiveBlending,
    })
  );
  sunGlow.scale.set(150, 150, 1);
  sunGlow.position.copy(sun.position);
  scene.add(sunGlow);

  // Clouds.
  // Increase the count from 5 to 10 (or more if desired).
  for (let i = 0; i < 10; i++) {
    let cloud = createCloud();
    // Position cloud using a random angle/distance, then add an additional offset.
    let a = Math.random() * 2 * Math.PI;
    let d = 700 + Math.random() * 200;
    cloud.position.set(Math.cos(a) * d + 10, 300 + Math.random() * 50, Math.sin(a) * d);
    scene.add(cloud);
    clouds.push(cloud);
  }
}

function createCloud() {
  const cloudTexture = new THREE.TextureLoader().load('./images/CloudFit_WhiteCloud.png');
  const spriteMaterial = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true });
  const cloudSprite = new THREE.Sprite(spriteMaterial);
  // Increase the scale to make the cloud bigger.
  cloudSprite.scale.set(80, 50, 1); // Adjust values as needed.
  // Optionally offset the cloud or leave its position at (0,0,0) here,
  // then let the addCloud logic set its world position.
  // e.g. cloudSprite.position.set(10, 0, 0);
  return cloudSprite;
}

// Call this update function from your animate loop in main.js:
export function updateClouds(delta) {
  // delta: time elapsed since last frame.
  // Adjust cloud speed as needed.
  const speed = 10; // units per second
  for (let cloud of clouds) {
    // Move the cloud slowly along X (or any axis, or even using a vector).
    cloud.position.x += speed * delta;
    // Optionally, if cloud moves too far right, wrap it back to left.
    if (cloud.position.x > 1000) {
      cloud.position.x = -1000;
    }
  }
}