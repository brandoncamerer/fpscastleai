// NO import * as THREE from 'three'; // Global THREE is assumed

// Helper function to create battlements (crenellations)
function createBattlements(width, depth, height, segmentLength, gapLength, material) {
  const battlementsGroup = new THREE.Group();
  const totalSegmentGap = segmentLength + gapLength;
  const numSegments = Math.floor(width / totalSegmentGap);
  const totalBattlementsWidth = numSegments * totalSegmentGap - gapLength;
  const startOffset = (width - totalBattlementsWidth) / 2;

  const battlementGeometry = new THREE.BoxGeometry(segmentLength, height, depth);
  for (let i = 0; i < numSegments; i++) {
    const merlon = new THREE.Mesh(battlementGeometry, material);
    merlon.position.set(
      -width / 2 + startOffset + i * totalSegmentGap + segmentLength / 2,
      height / 2,
      0
    );
    battlementsGroup.add(merlon);
  }
  return battlementsGroup;
}

// Export buildCastle; note towers are now named "castlePillar" so they won't be included in collision checks.
export function buildCastle(scene, obstacles, castleWallBounds, getTerrainHeight, castlePosition = new THREE.Vector3(0, 0, 0), castleIndex = 0) {
  const floorSize = 120;
  const margin = 20;
  const groundLevel = getTerrainHeight(castlePosition.x, castlePosition.z);
  
  // Clear nearby obstacles.
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].type === "tree" || obstacles[i].type === "rock") {
      const distSq = (obstacles[i].x - castlePosition.x) ** 2 + (obstacles[i].z - castlePosition.z) ** 2;
      const clearRadiusSq = (floorSize / 2 + margin) ** 2;
      if (distSq < clearRadiusSq) {
        if (obstacles[i].meshes) {
          obstacles[i].meshes.forEach(mesh => scene.remove(mesh));
        } else if (obstacles[i].mesh) {
          scene.remove(obstacles[i].mesh);
        }
        obstacles.splice(i, 1);
      }
    }
  }
  
  const castle = new THREE.Group();
  castle.name = "Castle " + (castleIndex + 1);
  
  // --- Materials ---
  // Vary stone color using HSL (giving a different hue for each castle)
  const baseHue = (castleIndex * 0.33) % 1.0;
  const stoneColor = new THREE.Color().setHSL(baseHue, 0.5, 0.5).getHex();
  const floorColor = 0x7d7d7d;
  const woodColor = 0x8B4513;
  const flagColor = 0xFF0000;
  const panelColor = 0x333333;
  
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: stoneColor, roughness: 0.8, metalness: 0.1 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.9, metalness: 0.1 });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.7, metalness: 0.0 });
  const flagMaterial = new THREE.MeshBasicMaterial({ color: flagColor, side: THREE.DoubleSide });
  const panelMaterialBase = new THREE.MeshBasicMaterial({ color: panelColor, side: THREE.DoubleSide });
  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = "anonymous";
  
  // --- Dimensions ---
  const floorThickness = 3;
  const wallHeight = 40;
  const wallThickness = 5;
  const gatehouseHeight = 50;
  const towerRadius = 10;
  const towerHeight = 55;
  const battlementHeight = 4;
  const battlementSegment = 3;
  const battlementGap = 2;
  
  // Panel dimensions.
  const panelWidth = 50;
  const panelHeight = 20;
  
  const halfSize = floorSize / 2;
  const floorY = floorThickness / 2;
  const wallY = floorThickness + wallHeight / 2;
  const gatehouseY = floorThickness + gatehouseHeight / 2;
  const towerY = floorThickness + towerHeight / 2;
  
  // --- Castle Floor ---
  const floorGeometry = new THREE.BoxGeometry(floorSize, floorThickness, floorSize);
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.position.set(0, floorY, 0);
  floorMesh.castShadow = true;
  floorMesh.receiveShadow = true;
  castle.add(floorMesh);
  
  const addWallBounds = (minX, maxX, minZ, maxZ) => castleWallBounds.push({ minX, maxX, minZ, maxZ });
  const battlementMaterial = stoneMaterial;
  
  // --- Back Wall ---
  const backGeometry = new THREE.BoxGeometry(floorSize - 2 * towerRadius, wallHeight, wallThickness);
  backGeometry.center(); // Ensure the geometry is centered
  const backWall = new THREE.Mesh(backGeometry, stoneMaterial);
  backWall.position.set(0, wallY, -halfSize + wallThickness / 2);
  backWall.name = "castleWall";
  backWall.userData.castleIndex = castleIndex;
  backWall.userData.blockCollision = true;
  backWall.userData.collider = { 
    halfSize: new THREE.Vector3((floorSize - 2 * towerRadius) / 2, wallHeight / 2, wallThickness / 2) 
  };
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  castle.add(backWall);
  addWallBounds(-halfSize + towerRadius, halfSize - towerRadius, -halfSize, -halfSize + wallThickness);
  
  // Back battlements.
  const backBattlements = createBattlements(floorSize - 2 * towerRadius, wallThickness, battlementHeight, battlementSegment, battlementGap, battlementMaterial);
  backBattlements.position.set(0, wallY + wallHeight / 2, -halfSize + wallThickness / 2);
  castle.add(backBattlements);
  
  // --- Front Wall (with door opening) ---
  const openingWidth = 20;
  const segmentWidth = (floorSize - 2 * towerRadius - openingWidth) / 2;
  
  const frontLeftGeometry = new THREE.BoxGeometry(segmentWidth, gatehouseHeight, wallThickness);
  const frontLeft = new THREE.Mesh(frontLeftGeometry, stoneMaterial);
  frontLeft.userData.collider = {
    halfSize: new THREE.Vector3(segmentWidth / 2, gatehouseHeight / 2, wallThickness / 2)
  };
  frontLeft.position.set(-towerRadius - openingWidth / 2 - segmentWidth / 2, gatehouseY, halfSize - wallThickness / 2);
  frontLeft.name = "castleWall";
  frontLeft.userData.castleIndex = castleIndex;
  frontLeft.castShadow = true;
  frontLeft.receiveShadow = true;
  castle.add(frontLeft);
  addWallBounds(-halfSize + towerRadius, -openingWidth / 2, halfSize - wallThickness, halfSize);
  
  const frontLeftBattlements = createBattlements(segmentWidth, wallThickness, battlementHeight, battlementSegment, battlementGap, battlementMaterial);
  frontLeftBattlements.position.set(frontLeft.position.x, gatehouseY + gatehouseHeight / 2, halfSize - wallThickness / 2);
  castle.add(frontLeftBattlements);
  
  const frontRightGeometry = new THREE.BoxGeometry(segmentWidth, gatehouseHeight, wallThickness);
  const frontRight = new THREE.Mesh(frontRightGeometry, stoneMaterial);
  frontRight.userData.collider = {
    halfSize: new THREE.Vector3(segmentWidth / 2, gatehouseHeight / 2, wallThickness / 2)
  };
  frontRight.position.set(towerRadius + openingWidth / 2 + segmentWidth / 2, gatehouseY, halfSize - wallThickness / 2);
  frontRight.name = "castleWall";
  frontRight.userData.castleIndex = castleIndex;
  frontRight.castShadow = true;
  frontRight.receiveShadow = true;
  castle.add(frontRight);
  addWallBounds(openingWidth / 2, halfSize - towerRadius, halfSize - wallThickness, halfSize);
  
  const frontRightBattlements = createBattlements(segmentWidth, wallThickness, battlementHeight, battlementSegment, battlementGap, battlementMaterial);
  frontRightBattlements.position.set(frontRight.position.x, gatehouseY + gatehouseHeight / 2, halfSize - wallThickness / 2);
  castle.add(frontRightBattlements);
  
  // --- Left Wall ---
  const sideGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, floorSize - 2 * towerRadius);
  const leftWall = new THREE.Mesh(sideGeometry, stoneMaterial);
  leftWall.userData.collider = {
    halfSize: new THREE.Vector3(wallThickness / 2, wallHeight / 2, (floorSize - 2 * towerRadius) / 2)
  };
  leftWall.position.set(-halfSize + wallThickness / 2, wallY, 0);
  leftWall.name = "castleWall";
  leftWall.userData.castleIndex = castleIndex;
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  castle.add(leftWall);
  addWallBounds(-halfSize, -halfSize + wallThickness, -halfSize + towerRadius, halfSize - towerRadius);
  
  const leftBattlements = createBattlements(floorSize - 2 * towerRadius, wallThickness, battlementHeight, battlementSegment, battlementGap, battlementMaterial);
  leftBattlements.position.set(-halfSize + wallThickness / 2, wallY + wallHeight / 2, 0);
  leftBattlements.rotation.y = Math.PI / 2;
  castle.add(leftBattlements);
  
  // --- Right Wall ---
  const rightWall = new THREE.Mesh(sideGeometry, stoneMaterial);
  rightWall.userData.collider = {
    halfSize: new THREE.Vector3(wallThickness / 2, wallHeight / 2, (floorSize - 2 * towerRadius) / 2)
  };
  rightWall.position.set(halfSize - wallThickness / 2, wallY, 0);
  rightWall.name = "castleWall";
  rightWall.userData.castleIndex = castleIndex;
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  castle.add(rightWall);
  addWallBounds(halfSize - wallThickness, halfSize, -halfSize + towerRadius, halfSize - towerRadius);
  
  const rightBattlements = createBattlements(floorSize - 2 * towerRadius, wallThickness, battlementHeight, battlementSegment, battlementGap, battlementMaterial);
  rightBattlements.position.set(halfSize - wallThickness / 2, wallY + wallHeight / 2, 0);
  rightBattlements.rotation.y = Math.PI / 2;
  castle.add(rightBattlements);
  
  // --- Corner Towers (Pillars) ---
  const towerMaterial = stoneMaterial;
  const originalTowerRadius = 10;
  const originalTowerHeight = 55;
  const towerPositions = [
    new THREE.Vector3(-halfSize + originalTowerRadius, floorThickness + originalTowerHeight / 2, -halfSize + originalTowerRadius),
    new THREE.Vector3(halfSize - originalTowerRadius, floorThickness + originalTowerHeight / 2, -halfSize + originalTowerRadius),
    new THREE.Vector3(-halfSize + originalTowerRadius, floorThickness + originalTowerHeight / 2, halfSize - originalTowerRadius),
    new THREE.Vector3(halfSize - originalTowerRadius, floorThickness + originalTowerHeight / 2, halfSize - originalTowerRadius)
  ];

  towerPositions.forEach((pos, index) => {
    let currentTowerRadius = originalTowerRadius;
    let currentTowerHeight = originalTowerHeight;
    // For front pillars (index 2 and 3), make them taller and wider.
    if (index >= 2) {
      currentTowerRadius = 14;
      currentTowerHeight = 70;
      // Adjust the y position for front towers.
      pos.y = floorThickness + currentTowerHeight / 2;
    }
    const towerGeo = new THREE.CylinderGeometry(currentTowerRadius, currentTowerRadius, currentTowerHeight, 16);
    const tower = new THREE.Mesh(towerGeo, towerMaterial);
    tower.position.copy(pos);
    tower.name = "castlePillar";
    tower.castShadow = true;
    tower.receiveShadow = true;
    castle.add(tower);

    // Tower battlements.
    const numBattlementSections = 8;
    for (let i = 0; i < numBattlementSections; i++) {
      const angle = (i / numBattlementSections) * Math.PI * 2;
      const merlonGeometry = new THREE.BoxGeometry(battlementSegment * 1.5, battlementHeight, wallThickness * 0.5);
      const merlon = new THREE.Mesh(merlonGeometry, battlementMaterial);
      const radiusOffset = currentTowerRadius - wallThickness * 0.25;
      // Determine the battlement y position.
      const towerTopY = (index >= 2)
        ? (floorThickness + currentTowerHeight + battlementHeight / 2)
        : (floorThickness + originalTowerHeight + battlementHeight / 2);
      merlon.position.set(
        pos.x + Math.cos(angle) * radiusOffset,
        towerTopY,
        pos.z + Math.sin(angle) * radiusOffset
      );
      merlon.rotation.y = angle + Math.PI / 2;
      merlon.castShadow = true;
      castle.add(merlon);
    }

    // Add flag only on front towers.
    if (index >= 2) {
      const poleHeight = 15;
      const poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, poleHeight, 8);
      const pole = new THREE.Mesh(poleGeometry, woodMaterial);
      pole.position.set(pos.x, floorThickness + currentTowerHeight + poleHeight / 2, pos.z);
      pole.castShadow = true;
      castle.add(pole);

      const flagGeometry = new THREE.PlaneGeometry(8, 5);
      const flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(4, poleHeight / 2 - 3.5, 0.6);
      flag.rotation.y = Math.PI;
      pole.add(flag);
    }
  });

  // --- Add Interactive Panels ("TVs") ---
  const panelImages = [
    "https://cloudfitsoftware.com/img/industries.jpg",
    "https://dummyimage.com/512x512/ffffff/000000.png?text=Screen+2",
    "https://dummyimage.com/512x512/ffffff/000000.png?text=Screen+3",
    "https://dummyimage.com/512x512/ffffff/000000.png?text=Screen+4",
    "https://dummyimage.com/512x512/ffffff/000000.png?text=Screen+5",
    "https://dummyimage.com/512x512/ffffff/000000.png?text=Screen+6",
    "https://dummyimage.com/512x512/ffffff/000000.png?text=Screen+7",
    "https://dummyimage.com/512x512/ffffff/000000.png?text=Screen+8",
    "https://dummyimage.com/512x512/ffffff/000000.png?text=Screen+9"
  ];
  
  // Place one panel per wall: left, right, back.
  const panelY = floorThickness + 25;
  const offset = 2;
  const leftPanelPos = new THREE.Vector3(-halfSize + wallThickness + offset, panelY, 0);
  const rightPanelPos = new THREE.Vector3(halfSize - wallThickness - offset, panelY, 0);
  const backPanelPos = new THREE.Vector3(0, panelY, -halfSize + wallThickness + offset);
  
  const baseIdx = castleIndex * 3;
  const leftImage = panelImages[baseIdx + 0];
  const rightImage = panelImages[baseIdx + 1];
  const backImage = panelImages[baseIdx + 2];
  
  const leftTexture = textureLoader.load(leftImage);
  const leftPanel = new THREE.Mesh(new THREE.PlaneGeometry(panelWidth, panelHeight),
    new THREE.MeshBasicMaterial({ color: 0xffffff, map: leftTexture, side: THREE.DoubleSide }));
  leftPanel.position.copy(leftPanelPos);
  leftPanel.rotation.y = Math.PI / 2;
  leftPanel.userData.url = "https://example.com/project_alpha";
  leftPanel.name = "castlePanel";
  castle.add(leftPanel);
  
  const rightTexture = textureLoader.load(rightImage);
  const rightPanel = new THREE.Mesh(new THREE.PlaneGeometry(panelWidth, panelHeight),
    new THREE.MeshBasicMaterial({ color: 0xffffff, map: rightTexture, side: THREE.DoubleSide }));
  rightPanel.position.copy(rightPanelPos);
  rightPanel.rotation.y = -Math.PI / 2;
  rightPanel.userData.url = "https://example.com/project_beta";
  rightPanel.name = "castlePanel";
  castle.add(rightPanel);
  
  const backTexture = textureLoader.load(backImage);
  const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(panelWidth, panelHeight),
    new THREE.MeshBasicMaterial({ color: 0xffffff, map: backTexture, side: THREE.DoubleSide }));
  backPanel.position.copy(backPanelPos);
  backPanel.rotation.y = Math.PI;
  backPanel.userData.url = "https://example.com/project_gamma";
  backPanel.name = "castlePanel";
  castle.add(backPanel);
  
  return castle;
}

function collides(pos) {
  for (let wall of castleWalls) {
    if (wall.userData.blockCollision === false) continue;
    let box = new THREE.Box3().setFromObject(wall);
    box.expandByScalar(0.2);
    if (box.containsPoint(pos)) {
      console.log("Collision with wall:", wall.name);
      return true;
    }
  }
  return false;
}