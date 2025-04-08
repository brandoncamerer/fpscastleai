export function getTerrainHeight(x, z) {
    const r = Math.sqrt(x * x + z * z);
    const offset = 10;
    const hillVariation = 5 * Math.sin(x / 50) * Math.cos(z / 50);
    const shoreRadius = 200, fadeDistance = 50;
    let factor = 1;
    if (r > shoreRadius) {
      factor = Math.max(0, 1 - (r - shoreRadius) / fadeDistance);
    }
    return offset + factor * hillVariation;
  }
  
  export function computeTerrainNormal(x, z) {
    const eps = 0.1;
    let hL = getTerrainHeight(x - eps, z);
    let hR = getTerrainHeight(x + eps, z);
    let hD = getTerrainHeight(x, z - eps);
    let hU = getTerrainHeight(x, z + eps);
    let dx = (hR - hL) / (2 * eps);
    let dz = (hU - hD) / (2 * eps);
    let normal = new THREE.Vector3(-dx, 1, -dz);
    normal.normalize();
    return normal;
  }