const randomBetween = (min, max) => Math.random() * (max - min) + min;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionPlanes = [
  { name: "far", scale: 0.48, speed: 0.46, weight: 0.34 },
  { name: "middle", scale: 0.82, speed: 0.76, weight: 0.44 },
  { name: "near", scale: 1.28, speed: 1.3, weight: 0.22 },
];

function chooseMotionPlane() {
  const roll = Math.random();
  let cumulativeWeight = 0;

  for (const plane of motionPlanes) {
    cumulativeWeight += plane.weight;
    if (roll <= cumulativeWeight) return plane;
  }

  return motionPlanes[1];
}

function populateStars(field, count, depth) {
  const fragment = document.createDocumentFragment();
  const isFar = depth === "far";
  const isBright = depth === "bright";

  for (let index = 0; index < count; index += 1) {
    const x = randomBetween(1, 99);
    const y = randomBetween(0, 100);
    const brightnessRoll = Math.random();
    const lightness = isBright
      ? randomBetween(84, 98)
      : brightnessRoll > 0.93
        ? randomBetween(88, 97)
        : brightnessRoll > 0.68
          ? randomBetween(62, 79)
          : randomBetween(28, 57);
    const hue = Math.random() < 0.55 ? randomBetween(185, 220) : randomBetween(38, 72);
    const saturation = isBright
      ? randomBetween(10, 28)
      : isFar
        ? randomBetween(5, 15)
        : randomBetween(8, 22);
    const size = isBright
      ? randomBetween(1.15, 2.05)
      : isFar
        ? randomBetween(0.45, 0.9)
        : randomBetween(0.7, 1.35);
    const glow = isBright && Math.random() < 0.28 ? randomBetween(1, 2.4) : 0;

    // The second copy is exactly one viewport lower, making the random field loop seamlessly.
    for (const yOffset of [0, 100]) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.setProperty("--star-x", `${x}vw`);
      star.style.setProperty("--star-y", `${y + yOffset}vh`);
      star.style.setProperty("--star-size", `${size}px`);
      star.style.setProperty("--star-hue", hue);
      star.style.setProperty("--star-saturation", `${saturation}%`);
      star.style.setProperty("--star-lightness", `${lightness}%`);
      star.style.setProperty("--star-glow", `${glow}px`);
      fragment.append(star);
    }
  }

  field.append(fragment);
}

populateStars(document.querySelector(".stars--far"), 170, "far");
populateStars(document.querySelector(".stars--near"), 72, "near");
populateStars(document.querySelector(".stars--bright"), 24, "bright");

function populateNebulae(field, count) {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const x = randomBetween(-12, 72);
    const y = randomBetween(0, 200);
    const width = randomBetween(36, 68);
    const height = randomBetween(22, 42);
    const hue = Math.random() < 0.5 ? randomBetween(188, 228) : randomBetween(274, 326);
    const isLuminous = index === 0 || Math.random() < 0.35;
    const opacity = isLuminous ? randomBetween(0.22, 0.34) : randomBetween(0.12, 0.19);
    const saturation = isLuminous ? randomBetween(72, 88) : randomBetween(48, 62);
    const lightness = isLuminous ? randomBetween(60, 70) : randomBetween(48, 58);
    const rotation = randomBetween(-24, 24);

    // Duplicate at exactly one field-length so the extremely slow drift remains seamless.
    for (const yOffset of [0, 200]) {
      const nebula = document.createElement("span");
      nebula.className = "nebula";
      nebula.style.setProperty("--nebula-x", `${x}vw`);
      nebula.style.setProperty("--nebula-y", `${y + yOffset}vh`);
      nebula.style.setProperty("--nebula-width", `${width}vw`);
      nebula.style.setProperty("--nebula-height", `${height}vh`);
      nebula.style.setProperty("--nebula-hue", hue);
      nebula.style.setProperty("--nebula-opacity", opacity);
      nebula.style.setProperty("--nebula-saturation", `${saturation}%`);
      nebula.style.setProperty("--nebula-lightness", `${lightness}%`);
      nebula.style.setProperty("--nebula-rotation", `${rotation}deg`);
      fragment.append(nebula);
    }
  }

  field.append(fragment);
}

populateNebulae(document.querySelector(".nebula-field"), 2);

function populateGalaxies(field, count) {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const x = randomBetween(4, 94);
    const y = randomBetween(0, 100);
    const width = randomBetween(54, 128);
    const hue = Math.random() < 0.55 ? randomBetween(198, 232) : randomBetween(276, 326);
    const tilt = randomBetween(-34, 34);
    const opacity = randomBetween(0.13, 0.24);

    for (const yOffset of [0, 100]) {
      const galaxy = document.createElement("span");
      galaxy.className = "galaxy";
      galaxy.style.setProperty("--galaxy-x", `${x}vw`);
      galaxy.style.setProperty("--galaxy-y", `${y + yOffset}vh`);
      galaxy.style.setProperty("--galaxy-width", `${width}px`);
      galaxy.style.setProperty("--galaxy-hue", hue);
      galaxy.style.setProperty("--galaxy-tilt", `${tilt}deg`);
      galaxy.style.setProperty("--galaxy-opacity", `${opacity}`);
      fragment.append(galaxy);
    }
  }

  field.append(fragment);
}

populateGalaxies(document.querySelector(".galaxy-field"), 4);

const stellarTypes = [
  { hue: 8, saturation: 72, lightness: 62, luminosity: 0.08, radius: 0.72, weight: 0.28 },
  { hue: 28, saturation: 78, lightness: 66, luminosity: 0.42, radius: 0.88, weight: 0.3 },
  { hue: 48, saturation: 84, lightness: 74, luminosity: 1, radius: 1, weight: 0.32 },
  { hue: 205, saturation: 34, lightness: 88, luminosity: 2.2, radius: 1.18, weight: 0.1 },
];

function chooseStellarType() {
  const roll = Math.random();
  let cumulativeWeight = 0;

  for (const stellarType of stellarTypes) {
    cumulativeWeight += stellarType.weight;
    if (roll <= cumulativeWeight) return stellarType;
  }

  return stellarTypes[stellarTypes.length - 1];
}

function choosePlanetAppearance(orbitalDistance, stellarType) {
  const irradiance = stellarType.luminosity / (orbitalDistance ** 2);
  const normalizedLight = Math.min(1, irradiance / 1.2);
  const typeRoll = Math.random();
  const iceThreshold = irradiance < 0.34 ? 0.52 : 0.1;
  const type = typeRoll < iceThreshold
    ? "ice"
    : typeRoll < iceThreshold + 0.3
      ? "gas"
      : "rocky";
  const hue = type === "ice"
    ? randomBetween(188, 218)
    : type === "gas"
      ? (Math.random() < 0.72 ? randomBetween(22, 58) : randomBetween(185, 214))
      : (Math.random() < 0.72 ? randomBetween(14, 48) : randomBetween(185, 212));

  return { type, hue, normalizedLight };
}

function stylePlanetBody(body, size, orbitalDistance, stellarType, starX, starY) {
  const { type, hue, normalizedLight } = choosePlanetAppearance(orbitalDistance, stellarType);
  const starAngle = Math.atan2(starY, starX);
  const lightX = 50 + Math.cos(starAngle) * 34;
  const lightY = 50 + Math.sin(starAngle) * 34;

  body.style.setProperty("--planet-size", `${size}px`);
  body.style.setProperty("--planet-hue", `${Math.round(hue)}`);
  body.style.setProperty("--planet-tilt", `${randomBetween(-14, 14)}deg`);
  body.style.setProperty("--surface-rotation", `${randomBetween(-18, 18)}deg`);
  body.style.setProperty("--ring-tilt", `${randomBetween(-18, -7)}deg`);
  body.style.setProperty("--feature-x1", `${randomBetween(25, 72)}%`);
  body.style.setProperty("--feature-y1", `${randomBetween(24, 72)}%`);
  body.style.setProperty("--feature-x2", `${randomBetween(22, 76)}%`);
  body.style.setProperty("--feature-y2", `${randomBetween(28, 78)}%`);
  body.style.setProperty("--light-x", `${lightX}%`);
  body.style.setProperty("--light-y", `${lightY}%`);
  body.style.setProperty("--planet-brightness", `${0.58 + normalizedLight * 0.52}`);
  body.style.setProperty("--terminator-opacity", `${0.94 - normalizedLight * 0.3}`);
  body.classList.remove("planet--rocky", "planet--gas", "planet--ice");
  body.classList.add(`planet--${type}`);

  const ringChance = type === "gas" ? 0.22 : 0.025;
  const atmosphereChance = type === "ice" ? 0.48 : type === "gas" ? 0.38 : 0.2;
  body.classList.toggle("planet--ringed", Math.random() < ringChance);
  body.classList.toggle("planet--atmosphere", Math.random() < atmosphereChance);
  body.style.setProperty("--atmosphere-hue", `${type === "ice" ? hue : hue + randomBetween(12, 42)}`);
  body.style.setProperty("--atmosphere-opacity", `${randomBetween(0.28, 0.58)}`);
}

function appendPlanetParts(body) {
  const ringBack = document.createElement("span");
  ringBack.className = "planet__ring planet__ring--back";
  const surface = document.createElement("span");
  surface.className = "planet__surface";
  const ringFront = document.createElement("span");
  ringFront.className = "planet__ring planet__ring--front";
  body.append(ringBack, surface, ringFront);
}

function appendMoons(body, planetSize, stellarType) {
  if (planetSize < 18 || Math.random() > 0.48) return;

  const moonCount = Math.random() < 0.2 ? 2 : 1;
  for (let index = 0; index < moonCount; index += 1) {
    const moon = document.createElement("span");
    const angle = randomBetween(0, Math.PI * 2);
    const distance = planetSize * randomBetween(0.78 + index * 0.32, 1.12 + index * 0.42);
    const moonSize = planetSize * randomBetween(0.08, 0.18);

    moon.className = "planet__moon";
    moon.style.setProperty("--moon-x", `${Math.cos(angle) * distance}px`);
    moon.style.setProperty("--moon-y", `${Math.sin(angle) * distance * 0.48}px`);
    moon.style.setProperty("--moon-size", `${Math.max(2, moonSize)}px`);
    moon.style.setProperty("--moon-hue", `${stellarType.hue + randomBetween(-28, 18)}`);
    moon.style.setProperty("--moon-lightness", `${randomBetween(48, 72)}%`);
    moon.style.zIndex = Math.sin(angle) > 0 ? 4 : "0";
    body.append(moon);
  }
}

function createAsteroidBelt(system, depthValue, radius, stellarType) {
  const belt = document.createElement("span");
  const beltWidth = radius * 2;
  const beltHeight = radius * randomBetween(0.34, 0.5);
  const asteroidCount = Math.round(24 + depthValue * 24);

  belt.className = "asteroid-belt";
  belt.style.setProperty("--belt-width", `${beltWidth}px`);
  belt.style.setProperty("--belt-height", `${beltHeight}px`);
  belt.style.setProperty("--belt-tilt", `${randomBetween(-18, 18)}deg`);

  for (let index = 0; index < asteroidCount; index += 1) {
    const asteroid = document.createElement("i");
    const angle = (index / asteroidCount) * Math.PI * 2 + randomBetween(-0.07, 0.07);
    const radialJitter = randomBetween(0.88, 1.12);
    const x = Math.cos(angle) * beltWidth * 0.5 * radialJitter;
    const y = Math.sin(angle) * beltHeight * 0.5 * radialJitter;

    asteroid.className = "asteroid";
    asteroid.style.setProperty("--asteroid-x", `${x}px`);
    asteroid.style.setProperty("--asteroid-y", `${y}px`);
    asteroid.style.setProperty("--asteroid-size", `${randomBetween(1.1, 1.8 + depthValue * 1.8)}px`);
    asteroid.style.setProperty("--asteroid-rotation", `${randomBetween(0, 180)}deg`);
    asteroid.style.setProperty("--asteroid-opacity", `${randomBetween(0.58, 0.96)}`);
    asteroid.style.setProperty("--asteroid-hue", `${stellarType.hue + randomBetween(-20, 20)}`);
    asteroid.style.setProperty("--asteroid-lightness", `${randomBetween(42, 68)}%`);
    belt.append(asteroid);
  }

  system.append(belt);
}

function randomizePlanet(system, depth, initial = false) {
  const isFar = depth === "far";
  const depthValue = initial
    ? (isFar ? randomBetween(0.06, 0.34) : randomBetween(0.54, 0.96))
    : Number(system.dataset.depth);
  const baseSize = 14 + depthValue * 92;
  const visibleTransitTime = 160 - depthValue * 80;
  const fullCycleTime = visibleTransitTime / 0.35;
  const stellarType = chooseStellarType();
  const orbitScale = 62 + depthValue * 92;
  const planetCount = [1, 2, 2, 3, 3, 4][Math.floor(Math.random() * 6)];
  const orbitDistances = Array.from(
    { length: planetCount },
    (_, index) => 0.42 + index * randomBetween(0.42, 0.58) + randomBetween(0, 0.12),
  );
  const primaryIndex = Math.floor(Math.random() * planetCount);
  const orbitPoints = orbitDistances.map((distance) => {
    const angle = randomBetween(0, Math.PI * 2);
    const radius = orbitScale * Math.sqrt(distance);
    return { distance, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
  const primaryPoint = orbitPoints[primaryIndex];
  const sunX = -primaryPoint.x;
  const sunY = -primaryPoint.y;
  const sunSize = baseSize * (0.9 + stellarType.radius * 0.35);

  system.querySelectorAll(
    ".planet__companion, .asteroid-belt, .planet__moon, .planet__sun--secondary",
  ).forEach((item) => item.remove());
  system.style.setProperty("--planet-x", `${randomBetween(10, 90)}vw`);
  system.style.setProperty("--sun-x", `${sunX}px`);
  system.style.setProperty("--sun-y", `${sunY}px`);
  system.style.setProperty("--sun-size", `${sunSize}px`);
  system.style.setProperty("--sun-hue", stellarType.hue);
  system.style.setProperty("--sun-saturation", `${stellarType.saturation}%`);
  system.style.setProperty("--sun-lightness", `${Math.max(72, stellarType.lightness)}%`);
  stylePlanetBody(
    system,
    baseSize * randomBetween(0.68, 1),
    primaryPoint.distance,
    stellarType,
    sunX,
    sunY,
  );
  appendMoons(system, Number.parseFloat(system.style.getPropertyValue("--planet-size")), stellarType);

  if (Math.random() < 0.24) {
    const companionStar = document.createElement("span");
    const binaryAngle = randomBetween(0, Math.PI * 2);
    const binarySeparation = sunSize * randomBetween(0.62, 0.92);
    const companionType = chooseStellarType();

    companionStar.className = "planet__sun planet__sun--secondary";
    companionStar.style.setProperty("--sun2-x", `${sunX + Math.cos(binaryAngle) * binarySeparation}px`);
    companionStar.style.setProperty("--sun2-y", `${sunY + Math.sin(binaryAngle) * binarySeparation}px`);
    companionStar.style.setProperty("--sun2-size", `${sunSize * randomBetween(0.42, 0.72)}px`);
    companionStar.style.setProperty("--sun2-hue", companionType.hue);
    companionStar.style.setProperty("--sun2-saturation", `${companionType.saturation}%`);
    companionStar.style.setProperty("--sun2-lightness", `${Math.max(74, companionType.lightness)}%`);
    system.prepend(companionStar);
  }

  orbitPoints.forEach((point, index) => {
    if (index === primaryIndex) return;

    const companion = document.createElement("span");
    const x = sunX + point.x;
    const y = sunY + point.y;
    companion.className = "planet__companion";
    companion.style.setProperty("--orbit-x", `${x}px`);
    companion.style.setProperty("--orbit-y", `${y}px`);
    appendPlanetParts(companion);
    stylePlanetBody(
      companion,
      baseSize * randomBetween(0.25, 0.62),
      point.distance,
      stellarType,
      -point.x,
      -point.y,
    );
    appendMoons(
      companion,
      Number.parseFloat(companion.style.getPropertyValue("--planet-size")),
      stellarType,
    );
    system.append(companion);
  });

  if (Math.random() < (isFar ? 0.82 : 0.95)) {
    const beltDistance = randomBetween(0.7, Math.max(1.15, orbitDistances.at(-1) + 0.2));
    createAsteroidBelt(system, depthValue, orbitScale * Math.sqrt(beltDistance), stellarType);
  }

  if (initial) {
    system.dataset.depth = depthValue;
    system.style.setProperty("--planet-speed", `${fullCycleTime}s`);
    system.style.setProperty("--planet-delay", `${-randomBetween(0, fullCycleTime)}s`);
  }
}

document.querySelectorAll(".planet-field").forEach((field) => {
  const depth = field.classList.contains("planet-field--far") ? "far" : "near";
  const count = Number(field.dataset.planets);

  for (let index = 0; index < count; index += 1) {
    const planet = document.createElement("span");
    planet.className = "planet";

    const sun = document.createElement("span");
    sun.className = "planet__sun";
    planet.append(sun);
    appendPlanetParts(planet);

    randomizePlanet(planet, depth, true);
    planet.addEventListener("animationiteration", () => randomizePlanet(planet, depth));
    field.append(planet);
  }
});

const rocket = document.querySelector(".rocket");
const hiddenStellarLights = Array.from({ length: 2 }, () => {
  const stellarType = chooseStellarType();
  return {
    hue: stellarType.hue,
    phase: randomBetween(0, Math.PI * 2),
    period: randomBetween(76000, 148000),
    angle: randomBetween(0, Math.PI * 2),
    drift: randomBetween(-0.000012, 0.000012),
    strength: randomBetween(0.16, 0.3),
  };
});
let lastLightingFrame = 0;

function updateRocketLighting(timestamp) {
  if (timestamp - lastLightingFrame > 33) {
    lastLightingFrame = timestamp;
    const rocketRect = rocket.getBoundingClientRect();
    const rocketX = rocketRect.left + rocketRect.width * 0.5;
    const rocketY = rocketRect.top + rocketRect.height * 0.42;
    const influenceRadius = Math.hypot(window.innerWidth, window.innerHeight) * 0.72;
    let vectorX = 0;
    let vectorY = 0;
    let totalInfluence = 0;
    let dominantInfluence = 0;
    let dominantHue = 48;

    document.querySelectorAll(".planet__sun").forEach((sun) => {
      const rect = sun.getBoundingClientRect();
      const sunX = rect.left + rect.width * 0.5;
      const sunY = rect.top + rect.height * 0.5;
      const deltaX = sunX - rocketX;
      const deltaY = sunY - rocketY;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const proximity = Math.max(0, 1 - distance / influenceRadius);
      const angularSize = Math.min(1.35, rect.width / 64);
      const systemOpacity = Number.parseFloat(getComputedStyle(sun.closest(".planet")).opacity);
      const influence = proximity * proximity * angularSize * systemOpacity;

      if (influence <= 0.002) return;

      vectorX += (deltaX / distance) * influence;
      vectorY += (deltaY / distance) * influence;
      totalInfluence += influence;

      if (influence > dominantInfluence) {
        const styles = getComputedStyle(sun);
        const hueProperty = sun.classList.contains("planet__sun--secondary")
          ? "--sun2-hue"
          : "--sun-hue";
        dominantInfluence = influence;
        dominantHue = Number.parseFloat(styles.getPropertyValue(hueProperty)) || 48;
      }
    });

    const vectorLength = Math.max(0.001, Math.hypot(vectorX, vectorY));
    const rimX = 50 + (vectorX / vectorLength) * 54;
    const rimY = 50 + (vectorY / vectorLength) * 54;
    const rimIntensity = Math.min(0.28, totalInfluence * 0.2);
    let frontVectorX = 0;
    let frontVectorY = 0;
    let frontInfluence = 0;
    let frontDominantInfluence = 0;
    let frontHue = 48;

    hiddenStellarLights.forEach((light) => {
      const phase = (timestamp / light.period) * Math.PI * 2 + light.phase;
      const passage = ((Math.sin(phase) + 1) * 0.5) ** 2;
      const influence = passage * light.strength;
      const angle = light.angle + timestamp * light.drift;

      frontVectorX += Math.cos(angle) * influence;
      frontVectorY += Math.sin(angle) * influence;
      frontInfluence += influence;

      if (influence > frontDominantInfluence) {
        frontDominantInfluence = influence;
        frontHue = light.hue;
      }
    });

    const frontVectorLength = Math.max(0.001, Math.hypot(frontVectorX, frontVectorY));
    const lightX = 50 + (frontVectorX / frontVectorLength) * 44;
    const lightY = 50 + (frontVectorY / frontVectorLength) * 44;
    const intensity = Math.min(0.34, frontInfluence);

    rocket.style.setProperty("--stellar-rim-x", `${rimX}%`);
    rocket.style.setProperty("--stellar-rim-y", `${rimY}%`);
    rocket.style.setProperty("--stellar-rim-hue", `${dominantHue}`);
    rocket.style.setProperty("--stellar-rim-intensity", `${rimIntensity}`);
    rocket.style.setProperty("--stellar-light-x", `${lightX}%`);
    rocket.style.setProperty("--stellar-light-y", `${lightY}%`);
    rocket.style.setProperty("--stellar-light-hue", `${frontHue}`);
    rocket.style.setProperty("--stellar-light-intensity", `${intensity}`);
    rocket.style.setProperty("--stellar-light-soft-intensity", `${intensity * 0.3}`);
  }

  window.requestAnimationFrame(updateRocketLighting);
}

window.requestAnimationFrame(updateRocketLighting);

document.querySelectorAll(".black-hole-field").forEach((field) => {
  const count = Number(field.dataset.blackHoles);

  for (let index = 0; index < count; index += 1) {
    const blackHole = document.createElement("span");
    const size = randomBetween(22, 42);
    const fullCycleTime = randomBetween(360, 520);

    blackHole.className = "black-hole";
    blackHole.style.setProperty("--black-hole-x", `${randomBetween(8, 92)}vw`);
    blackHole.style.setProperty("--black-hole-size", `${size}px`);
    blackHole.style.setProperty("--black-hole-tilt", `${randomBetween(-28, 28)}deg`);
    blackHole.style.setProperty("--black-hole-hue", `${randomBetween(20, 52)}`);
    blackHole.style.setProperty("--black-hole-speed", `${fullCycleTime}s`);
    blackHole.style.setProperty("--black-hole-delay", `${-randomBetween(0, fullCycleTime)}s`);
    field.append(blackHole);
  }
});

function launchComet() {
  if (document.hidden || reducedMotion.matches) return;

  const plane = chooseMotionPlane();
  const field = document.querySelector(`.comet-field--${plane.name}`);
  const comet = document.createElement("span");
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const angle = randomBetween(58, 122) * (Math.PI / 180);
  const distance = Math.hypot(viewportWidth, viewportHeight) * 1.35;
  const travelX = Math.cos(angle) * distance;
  const travelY = Math.sin(angle) * distance;
  const startX = randomBetween(-0.1, 1.1) * viewportWidth;
  const startY = -randomBetween(40, 120);
  const duration = distance / (randomBetween(34, 52) * plane.speed);

  comet.className = "comet";
  comet.style.setProperty("--comet-start-x", `${startX}px`);
  comet.style.setProperty("--comet-start-y", `${startY}px`);
  comet.style.setProperty("--comet-travel-x", `${travelX}px`);
  comet.style.setProperty("--comet-travel-y", `${travelY}px`);
  comet.style.setProperty("--comet-angle", `${angle * (180 / Math.PI)}deg`);
  comet.style.setProperty("--comet-size", `${randomBetween(4, 7) * plane.scale}px`);
  comet.style.setProperty("--comet-length", `${randomBetween(100, 190) * plane.scale}px`);
  comet.style.setProperty("--comet-speed", `${duration}s`);
  comet.style.setProperty("--comet-hue", `${randomBetween(184, 214)}`);
  comet.addEventListener("animationend", () => comet.remove(), { once: true });
  field.append(comet);
}

function scheduleComet() {
  const wait = randomBetween(28000, 52000);
  window.setTimeout(() => {
    launchComet();
    scheduleComet();
  }, wait);
}

window.setTimeout(() => {
  launchComet();
  scheduleComet();
}, randomBetween(3000, 8000));

function launchMeteor() {
  if (document.hidden || reducedMotion.matches) return;

  const plane = chooseMotionPlane();
  const field = document.querySelector(`.meteor-field--${plane.name}`);
  const meteor = document.createElement("span");
  const size = randomBetween(2.5, 5) * plane.scale;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const heading = randomBetween(0, Math.PI * 2);
  const directionX = Math.cos(heading);
  const directionY = Math.sin(heading);
  const perpendicularX = -directionY;
  const perpendicularY = directionX;
  const diagonal = Math.hypot(viewportWidth, viewportHeight);
  const travelDistance = diagonal * 2.4;

  // Move the path away from the centre while keeping it intersecting the viewport.
  const perpendicularReach =
    Math.abs(perpendicularX) * viewportWidth * 0.5 +
    Math.abs(perpendicularY) * viewportHeight * 0.5;
  const pathOffset = randomBetween(-0.82, 0.82) * perpendicularReach;
  const pathCentreX = viewportWidth * 0.5 + perpendicularX * pathOffset;
  const pathCentreY = viewportHeight * 0.5 + perpendicularY * pathOffset;
  const travelX = directionX * travelDistance;
  const travelY = directionY * travelDistance;
  const startX = pathCentreX - travelX * 0.5;
  const startY = pathCentreY - travelY * 0.5;
  const trajectoryAngle = heading * (180 / Math.PI);
  const duration = travelDistance / (randomBetween(900, 1200) * plane.speed);

  meteor.className = "meteor";
  meteor.style.setProperty("--meteor-start-x", `${startX}px`);
  meteor.style.setProperty("--meteor-start-y", `${startY}px`);
  meteor.style.setProperty("--meteor-travel-x", `${travelX}px`);
  meteor.style.setProperty("--meteor-travel-y", `${travelY}px`);
  meteor.style.setProperty("--meteor-size", `${size}px`);
  meteor.style.setProperty("--meteor-length", `${randomBetween(25, 70) * plane.scale}px`);
  meteor.style.setProperty("--meteor-angle", `${trajectoryAngle}deg`);
  meteor.style.setProperty("--meteor-speed", `${duration}s`);
  meteor.style.setProperty("--meteor-hue", `${randomBetween(22, 55)}`);
  meteor.addEventListener("animationend", () => meteor.remove(), { once: true });
  field.append(meteor);
}

function scheduleMeteor() {
  const wait = randomBetween(18000, 40000);
  window.setTimeout(() => {
    launchMeteor();
    scheduleMeteor();
  }, wait);
}

window.setTimeout(() => {
  launchMeteor();
  scheduleMeteor();
}, randomBetween(10000, 22000));
