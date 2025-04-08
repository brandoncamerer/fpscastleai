import { initEnvironment, updateClouds } from "./environment.js";
import { initObstacles } from "./obstacles.js";
import { buildCastle } from "./castle.js"; // castle.js must add three panels (name "castlePanel"), a screen ("castleScreen"), and mark walls ("castleWall")
import { initControls } from "./controls.js";

// Flat terrain: world is flat at height 10.
const flatTerrain = (x, z) => 10;

let scene, camera, renderer, controls;
let obstacles = [];
let rockCount = 0; // Player may hold at most one rock.
let thrownRocks = [];
let castleWalls = [];   // For collisions.
let castleScreens = []; // For interaction.
let castlePanels = [];  // For interaction.

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let canJump = true;
let prevTime = performance.now();
const GRAVITY = 392;
const playerRadius = 5;

function init() {

  // Set up scene, camera, and renderer.
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 200, 1500);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  const baseHeight = flatTerrain(0, 0); // Ground is at y = 10.
  controls = initControls(camera);
  // Spawn on the green square (center) at (0, baseHeight+10, 0)
  controls.getObject().position.set(0, baseHeight + 10, 0);
  // Orient camera to look toward (0, baseHeight, 200)
  camera.lookAt(new THREE.Vector3(0, baseHeight, 200));

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.SRGBEncoding;
  renderer.shadowMap.enabled = false;
  document.body.appendChild(renderer.domElement);

  // Initialize environment and obstacles using flatTerrain.
  initEnvironment(scene, flatTerrain);
  const obstacleData = initObstacles(scene, flatTerrain);
  obstacles = obstacleData.obstacles;

  // Spawn three castles.
  spawnCastles();

  // Add distant mountains.
  createMountains();

  // Add special object.
  const specialObj = createSpecialObject(flatTerrain);
  specialObj.position.set(-170, flatTerrain(200, -250) + 2.5, -210);
  scene.add(specialObj);

  // --- Overall Lighting Setup ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(200, 300, 100);
  directionalLight.castShadow = false;
  scene.add(directionalLight);
  // --- End Overall Lighting Setup ---

  initInput();
  window.addEventListener("resize", onWindowResize);

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function spawnCastles() {
  const castleCount = 3;
  const radius = 200;
  const bannerTexts = [
    "Image Generation",
    "Code Generation",
    "Text Generation"
  ];
  
  for (let i = 0; i < castleCount; i++) {
    const angle = (i / castleCount) * 2 * Math.PI;
    const pos = new THREE.Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    const castleWallBounds = [];
    const castle = buildCastle(scene, obstacles, castleWallBounds, flatTerrain, pos, i);
    castle.position.copy(pos);
    castle.rotation.y = Math.atan2(-pos.x, -pos.z);
    castle.updateMatrixWorld(true);
    scene.add(castle);

    const castleLight = new THREE.PointLight(0xffffff, 1.5, 300);
    castleLight.position.set(0, 50, 0);
    castle.add(castleLight);

    // Traverse castle children and store references.
    castle.traverse(child => {
      if (child.isMesh) {
        if (child.name === "castleWall") {
          child.material = new THREE.MeshLambertMaterial({
            color: 0x777777,
            emissive: 0x222222,
            emissiveIntensity: 0.5
          });
          child.userData.castleIndex = i;
          castleWalls.push(child);
        }
        if (child.name === "castlePanel") {
          castlePanels.push(child);
        }
        if (child.name === "castleScreen") {
          castleScreens.push(child);
        }
      }
    });
  
    // Retrieve a stone color from one of the castle walls.
    let bannerTextColor = "#ffffff";
    const wall = castle.getObjectByName("castleWall");
    if (wall && wall.material && wall.material.color) {
      bannerTextColor = '#' + wall.material.color.getHexString();
    }
  
    // Create and add the banner.
    const banner = createBanner(bannerTexts[i], bannerTextColor);
    // Lower the banner's Y position to be just under the castle walls.
    banner.position.set(0, 45, 62); // Adjust Y from 65 to 40.
    castle.add(banner);
  }
}

function createMountains() {
  function createMountain(a, r) {
    let h = 50 + Math.random() * 50;
    let b = 80 + Math.random() * 50;
    let mountain = new THREE.Mesh(
      new THREE.ConeGeometry(b, h, 4),
      new THREE.MeshLambertMaterial({ color: 0x556b2f })
    );
    mountain.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
    mountain.rotation.y = Math.random() * Math.PI;
    scene.add(mountain);
  }
  for (let i = 0; i < 10; i++) {
    createMountain((i / 10) * 2 * Math.PI, 600);
  }
}

function initInput() {
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("mousedown", onMouseDown);
}

function onMouseDown(e) {
  if (e.button === 0 && rockCount > 0 && controls.isLocked) {
    rockCount = 0;
    let rockGeometry = new THREE.DodecahedronGeometry(5, 0);
    let rockMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    let thrownRockMesh = new THREE.Mesh(rockGeometry, rockMaterial);
    let camPos = controls.getObject().position.clone();
    thrownRockMesh.position.copy(camPos);
    let throwDir = new THREE.Vector3();
    camera.getWorldDirection(throwDir);
    thrownRockMesh.position.add(throwDir.clone().multiplyScalar(5));
    let rockVelocity = throwDir.clone().multiplyScalar(200);
    rockVelocity.y += 50;
    thrownRocks.push({ mesh: thrownRockMesh, velocity: rockVelocity });
    scene.add(thrownRockMesh);
  }
}

let moveF = false, moveB = false, moveL = false, moveR = false, run = false;

function onKeyDown(e) {
  switch (e.code) {
    case "ArrowUp":
    case "KeyW":
      moveF = true;
      break;
    case "ArrowLeft":
    case "KeyA":
      moveL = true;
      break;
    case "ArrowDown":
    case "KeyS":
      moveB = true;
      break;
    case "ArrowRight":
    case "KeyD":
      moveR = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      run = true;
      break;
    case "Space":
      if (canJump) {
        velocity.y = 80;
        canJump = false;
      }
      break;
    case "KeyE":
      handleInteraction();
      break;
  }
}

function onKeyUp(e) {
  switch (e.code) {
    case "ArrowUp":
    case "KeyW":
      moveF = false;
      break;
    case "ArrowLeft":
    case "KeyA":
      moveL = false;
      break;
    case "ArrowDown":
    case "KeyS":
      moveB = false;
      break;
    case "ArrowRight":
    case "KeyD":
      moveR = false;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      run = false;
      break;
  }
}

function handleInteraction() {
  const playerPos = controls.getObject().position;
  // First check castle panels.
  for (let i = 0; i < castlePanels.length; i++) {
    let panelPos = new THREE.Vector3();
    castlePanels[i].getWorldPosition(panelPos);
    if (playerPos.distanceTo(panelPos) < 15) {
      if (castlePanels[i].userData.url) {
        window.open(castlePanels[i].userData.url, "_blank");
      } else {
        console.log("No URL defined for this panel.");
      }
      return;
    }
  }
  // Then check castle screens.
  for (let i = 0; i < castleScreens.length; i++) {
    let screenPos = new THREE.Vector3();
    castleScreens[i].getWorldPosition(screenPos);
    if (playerPos.distanceTo(screenPos) < 15) {
      console.log("Castle screen interaction triggered.");
      return;
    }
  }
  // Otherwise, attempt rock pickup.
  handleRockPickup();
}

function handleRockPickup() {
  if (rockCount >= 1) return;
  const playerPos = controls.getObject().position;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].type === "rock") {
      const d = playerPos.distanceTo(obstacles[i].mesh.position);
      if (d < 15) {
        rockCount = 1;
        scene.remove(obstacles[i].mesh);
        obstacles.splice(i, 1);
        break;
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  const t = performance.now();
  const delta = (t - prevTime) / 1000;
  
  // update clouds' positions
  updateClouds(delta);
  
  if (controls.isLocked) {
    const player = controls.getObject();
    const oldPos = player.position.clone();
    velocity.x -= velocity.x * 10 * delta;
    velocity.z -= velocity.z * 10 * delta;
    direction.set(
      Number(moveR) - Number(moveL),
      0,
      Number(moveB) - Number(moveF)
    ).normalize();
    const accel = 400 * (run ? 2 : 1);
    if (moveF || moveB) velocity.z -= direction.z * accel * delta;
    if (moveL || moveR) velocity.x -= direction.x * accel * delta;
    velocity.y -= GRAVITY * delta;
    const localDisp = new THREE.Vector3(-velocity.x * delta, 0, -velocity.z * delta);
    const worldDisp = localDisp.clone().applyQuaternion(camera.quaternion);
    const candidate = oldPos.clone().add(worldDisp);
    if (collides(candidate)) {
      candidate.x = oldPos.x;
      candidate.z = oldPos.z;
    }
    player.position.copy(candidate);
    player.position.y += velocity.y * delta;
    const floorHeight = flatTerrain(player.position.x, player.position.z) + 10;
    if (player.position.y < floorHeight) {
      player.position.y = floorHeight;
      velocity.y = 0;
      canJump = true;
    }
  }

  for (let i = thrownRocks.length - 1; i >= 0; i--) {
    let rock = thrownRocks[i];
    rock.mesh.position.add(rock.velocity.clone().multiplyScalar(delta));
    rock.velocity.y -= GRAVITY * delta * 0.5;
    
    let groundY = flatTerrain(rock.mesh.position.x, rock.mesh.position.z) + 2.5;
    if (rock.mesh.position.y <= groundY || rock.velocity.length() < 2.0) {
      rock.mesh.position.y = groundY;
      obstacles.push({ type: "rock", mesh: rock.mesh, radius: 5 });
      thrownRocks.splice(i, 1);
      continue;
    }
    
    for (let wall of castleWalls) {
      // Skip walls that are flagged as non-blocking.
      if (wall.userData.blockCollision === false) continue;
      let box = new THREE.Box3().setFromObject(wall);
      box.expandByScalar(1.0);
      if (box.containsPoint(rock.mesh.position)) {
        let newVel = new THREE.Vector3(
          -rock.velocity.x * 0.4,
          Math.abs(rock.velocity.y) * 0.4,
          -rock.velocity.z * 0.4
        );
        if (newVel.length() < 5) {
          newVel.setLength(5);
        }
        rock.velocity.copy(newVel);
        rock.mesh.position.add(rock.velocity.clone().multiplyScalar(delta));
        if (box.containsPoint(rock.mesh.position)) {
          let center = new THREE.Vector3();
          box.getCenter(center);
          let pushDir = rock.mesh.position.clone().sub(center).normalize();
          rock.mesh.position.add(pushDir.multiplyScalar(5));
        }
        break;
      }
    }
    
    if (rock.mesh.position.length() > 1000) {
      scene.remove(rock.mesh);
      thrownRocks.splice(i, 1);
    }
  }

  prevTime = t;
  renderer.render(scene, camera);
}

function collides(pos) {
  // Use the player's radius as a margin to expand the wall's collider
  const margin = playerRadius;
  for (let wall of castleWalls) {
    if (wall.userData.blockCollision === false) continue;
    wall.updateMatrixWorld(true);
    if (!wall.userData.collider) continue;
    
    // Compute inverse matrix so we can transform pos into the wall’s local space.
    const invMatrix = new THREE.Matrix4().copy(wall.matrixWorld).invert();
    const localPos = pos.clone().applyMatrix4(invMatrix);
    
    const half = wall.userData.collider.halfSize;
    // Expand the bounds by the player's radius so the collider effectively grows.
    if (
      Math.abs(localPos.x) <= (half.x + margin) &&
      Math.abs(localPos.y) <= (half.y + margin) &&
      Math.abs(localPos.z) <= (half.z + margin)
    ) {
      console.log("Collision with wall:", wall.name);
      return true;
    }
  }
  return false;
}

function createBanner(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");

  // Deep red gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, "#4b0000");
  bgGradient.addColorStop(1, "#1a0000");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Golden trim border
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#C9B037";
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Enhanced text styling
  ctx.font = "bold 24px 'Old English Text MT', 'Uncial Antiqua', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Glow + shadow
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 6;
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";

  // Stroke for text outline
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000000";
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

  // Gold gradient text
  const textGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  textGradient.addColorStop(0, "#fff1a8");  // light gold
  textGradient.addColorStop(0.5, "#FFD700"); // classic gold
  textGradient.addColorStop(1, "#b8860b");  // darker gold
  ctx.fillStyle = textGradient;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const geometry = new THREE.PlaneGeometry(80, 15);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true
  });

  const banner = new THREE.Mesh(geometry, material);
  return banner;
}

function createSpecialObject(getTerrainHeight) {
  // Create a pedestal.
  const pedestalGeo = new THREE.CylinderGeometry(3, 3, 5, 16);
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  
  // Create a glowing orb on top.
  const orbGeo = new THREE.SphereGeometry(2, 16, 16);
  const orbMat = new THREE.MeshStandardMaterial({ 
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.9
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.position.set(0, 4, 0);
  orb.castShadow = true;
  pedestal.add(orb);
  
  return pedestal;
}

init();