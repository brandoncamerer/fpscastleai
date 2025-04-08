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
export function buildCastle(scene, obstacles, castleWallBounds, getTerrainHeight, castlePosition = new THREE.Vector3(0, 0, 0)) {
  const floorSize = 120;
  const margin = 20;
  const groundLevel = getTerrainHeight(castlePosition.x, castlePosition.z);
  
  // --- Clear Obstacles ---
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

  // --- Materials ---
  const stoneColor = 0x6a6a6a;
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
  
  const addWallBounds = (minX, maxX, minZ, maxZ) => { castleWallBounds.push({ minX, maxX, minZ, maxZ }); };
  const battlementMaterial = stoneMaterial;
  
  // --- Back Wall ---
  const backGeometry = new THREE.BoxGeometry(floorSize - 2 * towerRadius, wallHeight, wallThickness);
  const backWall = new THREE.Mesh(backGeometry, stoneMaterial);
  backWall.position.set(0, wallY, -halfSize + wallThickness / 2);
  backWall.name = "castleWall";
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  castle.add(backWall);
  addWallBounds(-halfSize + towerRadius, halfSize - towerRadius, -halfSize, -halfSize + wallThickness);
  
  const backBattlements = createBattlements(floorSize - 2 * towerRadius, wallThickness, battlementHeight, battlementSegment, battlementGap, battlementMaterial);
  backBattlements.position.set(0, wallY + wallHeight / 2, -halfSize + wallThickness / 2);
  castle.add(backBattlements);
  
  // --- Front Wall (with door opening) ---
  const openingWidth = 20;
  const segmentWidth = (floorSize - 2 * towerRadius - openingWidth) / 2;
  
  const frontLeftGeometry = new THREE.BoxGeometry(segmentWidth, gatehouseHeight, wallThickness);
  const frontLeft = new THREE.Mesh(frontLeftGeometry, stoneMaterial);
  frontLeft.position.set(-towerRadius - openingWidth / 2 - segmentWidth / 2, gatehouseY, halfSize - wallThickness / 2);
  frontLeft.name = "castleWall";
  frontLeft.castShadow = true;
  frontLeft.receiveShadow = true;
  castle.add(frontLeft);
  addWallBounds(-halfSize + towerRadius, -openingWidth / 2, halfSize - wallThickness, halfSize);
  
  const frontLeftBattlements = createBattlements(segmentWidth, wallThickness, battlementHeight, battlementSegment, battlementGap, battlementMaterial);
  frontLeftBattlements.position.set(frontLeft.position.x, gatehouseY + gatehouseHeight / 2, halfSize - wallThickness / 2);
  castle.add(frontLeftBattlements);
  
  const frontRightGeometry = new THREE.BoxGeometry(segmentWidth, gatehouseHeight, wallThickness);
  const frontRight = new THREE.Mesh(frontRightGeometry, stoneMaterial);
  frontRight.position.set(towerRadius + openingWidth / 2 + segmentWidth / 2, gatehouseY, halfSize - wallThickness / 2);
  frontRight.name = "castleWall";
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
  leftWall.position.set(-halfSize + wallThickness / 2, wallY, 0);
  leftWall.name = "castleWall";
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
  rightWall.position.set(halfSize - wallThickness / 2, wallY, 0);
  rightWall.name = "castleWall";
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
  const towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
  const towerPositions = [
    new THREE.Vector3(-halfSize + towerRadius, towerY, -halfSize + towerRadius),
    new THREE.Vector3(halfSize - towerRadius, towerY, -halfSize + towerRadius),
    new THREE.Vector3(-halfSize + towerRadius, towerY, halfSize - towerRadius),
    new THREE.Vector3(halfSize - towerRadius, towerY, halfSize - towerRadius)
  ];
  
  towerPositions.forEach((pos, index) => {
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.copy(pos);
    // Mark towers as "castlePillar" so they're excluded from collision checks.
    tower.name = "castlePillar";
    tower.castShadow = true;
    tower.receiveShadow = true;
    castle.add(tower);
  
    // Tower Battlements.
    const numBattlementSections = 8;
    for (let i = 0; i < numBattlementSections; i++) {
      const angle = (i / numBattlementSections) * Math.PI * 2;
      const merlonGeometry = new THREE.BoxGeometry(battlementSegment * 1.5, battlementHeight, wallThickness * 0.5);
      const merlon = new THREE.Mesh(merlonGeometry, battlementMaterial);
      const radiusOffset = towerRadius - wallThickness * 0.25;
      merlon.position.set(
        pos.x + Math.cos(angle) * radiusOffset,
        towerY + towerHeight / 2 + battlementHeight / 2,
        pos.z + Math.sin(angle) * radiusOffset
      );
      merlon.rotation.y = angle + Math.PI / 2;
      merlon.castShadow = true;
      castle.add(merlon);
    }
  
    // Add Flag to front towers only.
    if (index >= 2) {
      const poleHeight = 15;
      const poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, poleHeight, 8);
      const pole = new THREE.Mesh(poleGeometry, woodMaterial);
      pole.position.set(pos.x, towerY + towerHeight / 2 + poleHeight / 2, pos.z);
      pole.castShadow = true;
      castle.add(pole);
  
      const flagGeometry = new THREE.PlaneGeometry(8, 5);
      const flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(0, poleHeight / 2 - 2.5, 4);
      flag.rotation.y = Math.PI / 2;
      pole.add(flag);
    }
  
    // Note: Towers (now "castlePillar") are not added to castleWallBounds.
  });
  
  // --- Add Interactive Panels ("TVs") ---
  const panelWidth = 50;
  const panelHeight = 20;
  const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
  
  const panelTextureLeft = textureLoader.load("https://via.placeholder.com/512/FFFFFF/0000FF?text=Project+Alpha");
  const panelTextureRight = textureLoader.load("https://via.placeholder.com/512/FFFFFF/FF0000?text=Project+Beta");
  const panelTextureBack = textureLoader.load("https://via.placeholder.com/512/FFFFFF/00AA00?text=Project+Gamma");
  
  const panelMaterialLeft = new THREE.MeshBasicMaterial({ color: panelColor, map: panelTextureLeft, side: THREE.DoubleSide });
  const panelMaterialRight = new THREE.MeshBasicMaterial({ color: panelColor, map: panelTextureRight, side: THREE.DoubleSide });
  const panelMaterialBack = new THREE.MeshBasicMaterial({ color: panelColor, map: panelTextureBack, side: THREE.DoubleSide });
  
  // Move panels higher: set panel Y position to floorThickness + 25.
  const panelY = floorThickness + 25;
  
  // Left Panel (on the interior side of the left wall)
  const panelLeft = new THREE.Mesh(panelGeometry, panelMaterialLeft);
  panelLeft.name = "castlePanel";
  panelLeft.position.set(-halfSize + wallThickness + 0.1, panelY, 0);
  panelLeft.rotation.y = Math.PI / 2;
  panelLeft.userData.url = "https://example.com/project_alpha";
  castle.add(panelLeft);
  
  // Right Panel (on the interior side of the right wall)
  const panelRight = new THREE.Mesh(panelGeometry, panelMaterialRight);
  panelRight.name = "castlePanel";
  panelRight.position.set(halfSize - wallThickness - 0.1, panelY, 0);
  panelRight.rotation.y = -Math.PI / 2;
  panelRight.userData.url = "https://example.com/project_beta";
  castle.add(panelRight);
  
  // Back Panel (on the interior side of the back wall)
  const panelBack = new THREE.Mesh(panelGeometry, panelMaterialBack);
  panelBack.name = "castlePanel";
  panelBack.position.set(0, panelY, -halfSize + wallThickness + 0.1);
  // Rotate so that its front face (default +Z) faces inward.
  panelBack.rotation.y = Math.PI;
  panelBack.userData.url = "https://example.com/project_gamma";
  castle.add(panelBack);
  
  return castle;
}