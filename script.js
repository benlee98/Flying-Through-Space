const randomBetween = (min, max) => Math.random() * (max - min) + min;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const compactDevice = window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;
const performanceScale = compactDevice ? 0.62 : 1;
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

populateStars(document.querySelector(".stars--far"), compactDevice ? 108 : 170, "far");
populateStars(document.querySelector(".stars--near"), compactDevice ? 46 : 72, "near");
populateStars(document.querySelector(".stars--bright"), compactDevice ? 15 : 24, "bright");

const nebulaSeed = Math.floor(Math.random() * 0x7fffffff);
const nebulaPalettes = [
  [[8, 19, 44], [24, 126, 164], [154, 57, 166], [246, 174, 84]],
  [[25, 12, 48], [111, 51, 158], [57, 194, 211], [239, 113, 91]],
  [[13, 27, 43], [41, 137, 125], [183, 57, 108], [247, 196, 105]],
];
const nebulaPalette = nebulaPalettes[Math.floor(Math.random() * nebulaPalettes.length)];

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createNoiseStack(seed, octaveCount = 5) {
  const random = seededRandom(seed);
  return Array.from({ length: octaveCount }, (_, octave) => {
    const frequency = 2 ** (octave + 1);
    return {
      frequency,
      values: Float32Array.from({ length: frequency * frequency }, random),
    };
  });
}

function sampleFractalNoise(stack, x, y) {
  let amplitude = 1;
  let amplitudeTotal = 0;
  let total = 0;

  stack.forEach(({ frequency, values }) => {
    const wrappedX = ((x % 1) + 1) % 1 * frequency;
    const wrappedY = ((y % 1) + 1) % 1 * frequency;
    const x0 = Math.floor(wrappedX) % frequency;
    const y0 = Math.floor(wrappedY) % frequency;
    const x1 = (x0 + 1) % frequency;
    const y1 = (y0 + 1) % frequency;
    const txRaw = wrappedX - Math.floor(wrappedX);
    const tyRaw = wrappedY - Math.floor(wrappedY);
    const tx = txRaw * txRaw * (3 - 2 * txRaw);
    const ty = tyRaw * tyRaw * (3 - 2 * tyRaw);
    const top = values[y0 * frequency + x0] * (1 - tx) + values[y0 * frequency + x1] * tx;
    const bottom = values[y1 * frequency + x0] * (1 - tx) + values[y1 * frequency + x1] * tx;

    total += (top * (1 - ty) + bottom * ty) * amplitude;
    amplitudeTotal += amplitude;
    amplitude *= 0.52;
  });

  return total / amplitudeTotal;
}

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (minimum, maximum, value) => {
  const amount = clamp01((value - minimum) / (maximum - minimum));
  return amount * amount * (3 - 2 * amount);
};

function blendVerticalTextureSeam(image, width, height) {
  const blendDepth = Math.min(48, Math.max(18, Math.floor(height * 0.1)));

  for (let offset = 0; offset < blendDepth; offset += 1) {
    const edgeWeight = (Math.cos(Math.PI * offset / blendDepth) + 1) * 0.5;
    const topY = offset;
    const bottomY = height - 1 - offset;

    for (let pixelX = 0; pixelX < width; pixelX += 1) {
      const topIndex = (topY * width + pixelX) * 4;
      const bottomIndex = (bottomY * width + pixelX) * 4;

      for (let channelIndex = 0; channelIndex < 4; channelIndex += 1) {
        const topValue = image.data[topIndex + channelIndex];
        const bottomValue = image.data[bottomIndex + channelIndex];
        const sharedEdgeValue = (topValue + bottomValue) * 0.5;

        image.data[topIndex + channelIndex] = topValue * (1 - edgeWeight) + sharedEdgeValue * edgeWeight;
        image.data[bottomIndex + channelIndex] = bottomValue * (1 - edgeWeight) + sharedEdgeValue * edgeWeight;
      }
    }
  }
}

function renderProceduralNebula() {
  const canvas = document.createElement("canvas");
  const width = compactDevice ? 280 : 420;
  const height = Math.round(Math.max(
    compactDevice ? 440 : 520,
    Math.min(
      compactDevice ? 720 : 960,
      width * window.innerHeight * 2 / window.innerWidth,
    ),
  ));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);
  const baseNoise = createNoiseStack(nebulaSeed + 11, 6);
  const warpXNoise = createNoiseStack(nebulaSeed + 37, 4);
  const warpYNoise = createNoiseStack(nebulaSeed + 71, 4);
  const ridgeNoise = createNoiseStack(nebulaSeed + 103, 6);
  const dustNoise = createNoiseStack(nebulaSeed + 149, 4);
  const chemistryNoise = createNoiseStack(nebulaSeed + 181, 4);
  const fineNoise = createNoiseStack(nebulaSeed + 223, 6);
  const cavities = Array.from({ length: 3 }, (_, index) => {
    const random = seededRandom(nebulaSeed + 211 + index * 17);
    return { x: random(), y: random(), radius: 0.08 + random() * 0.09 };
  });

  for (let pixelY = 0; pixelY < height; pixelY += 1) {
    for (let pixelX = 0; pixelX < width; pixelX += 1) {
      const u = pixelX / width;
      const v = pixelY / height;
      const warpX = sampleFractalNoise(warpXNoise, u, v) - 0.5;
      const warpY = sampleFractalNoise(warpYNoise, u + 0.31, v + 0.17) - 0.5;
      const warpedU = u + warpX * 0.2;
      const warpedV = v + warpY * 0.2;
      const base = sampleFractalNoise(baseNoise, warpedU, warpedV);
      const ridgeSample = sampleFractalNoise(ridgeNoise, warpedU * 1.06 + 0.13, warpedV * 1.06 - 0.09);
      const filaments = (1 - Math.abs(ridgeSample * 2 - 1)) ** 2.4;
      const fineSample = sampleFractalNoise(fineNoise, warpedU * 1.9 - 0.16, warpedV * 1.9 + 0.22);
      const fineFilaments = (1 - Math.abs(fineSample * 2 - 1)) ** 4.6;
      const dust = sampleFractalNoise(dustNoise, warpedU - 0.21, warpedV + 0.28);
      const chemistry = sampleFractalNoise(chemistryNoise, warpedU + 0.37, warpedV - 0.24);
      let density = smoothstep(0.45, 0.76, base * 0.55 + filaments * 0.31 + fineFilaments * 0.14);

      cavities.forEach((cavity) => {
        const deltaX = Math.min(Math.abs(u - cavity.x), 1 - Math.abs(u - cavity.x));
        const deltaY = Math.min(Math.abs(v - cavity.y), 1 - Math.abs(v - cavity.y));
        const distance = Math.hypot(deltaX, deltaY);
        const hollow = Math.exp(-(distance ** 2) / (cavity.radius ** 2));
        const rim = Math.exp(-((distance - cavity.radius) ** 2) / 0.0007);
        density = Math.max(0, density - hollow * 0.5) + rim * 0.12;
      });

      const transmission = Math.exp(-dust * 2.5);
      const emission = clamp01(
        density * (0.5 + filaments * 0.74 + fineFilaments * 0.36) * (0.52 + transmission * 0.48),
      );
      const chemicalMix = smoothstep(0.26, 0.74, chemistry);
      const thermalMix = smoothstep(0.34, 0.78, filaments * 0.48 + fineFilaments * 0.28 + density * 0.24);
      const colorSeparation = smoothstep(0.29, 0.7, chemistry * 0.5 + filaments * 0.32 + fineFilaments * 0.18);
      const pixelIndex = (pixelY * width + pixelX) * 4;
      const grain = ((pixelX * 17 + pixelY * 31 + nebulaSeed) & 7) - 3;

      for (let channelIndex = 0; channelIndex < 3; channelIndex += 1) {
        const coolChannel = nebulaPalette[0][channelIndex] * (1 - chemicalMix) + nebulaPalette[1][channelIndex] * chemicalMix;
        const hotChannel = nebulaPalette[2][channelIndex] * (1 - thermalMix) + nebulaPalette[3][channelIndex] * thermalMix;
        const gasColor = coolChannel * (1 - colorSeparation) + hotChannel * colorSeparation;
        image.data[pixelIndex + channelIndex] = gasColor + grain;
      }
      image.data[pixelIndex + 3] = clamp01(emission * 0.72) * 255;
    }
  }

  blendVerticalTextureSeam(image, width, height);
  context.putImageData(image, 0, 0);
  return `url("${canvas.toDataURL("image/png")}")`;
}

const nebulaDepthFields = document.querySelectorAll(".nebula-field, .nebula-depth-field");

function updateNebulaTexture() {
  const texture = renderProceduralNebula();
  nebulaDepthFields.forEach((field) => {
    field.style.backgroundImage = texture;
  });
}

updateNebulaTexture();

function populateNebulaLights(field, count) {
  const fragment = document.createDocumentFragment();
  const random = seededRandom(nebulaSeed + 307);

  for (let index = 0; index < count; index += 1) {
    const x = random() * 94 + 3;
    const y = random() * 100;
    const color = random() < 0.5 ? nebulaPalette[1] : nebulaPalette[3];
    const size = 0.8 + random() * 1.2;

    for (const yOffset of [0, 100]) {
      const light = document.createElement("span");
      light.className = "nebula-light";
      light.style.setProperty("--nebula-light-x", `${x}vw`);
      light.style.setProperty("--nebula-light-y", `${y + yOffset}vh`);
      light.style.setProperty("--nebula-light-size", `${size}px`);
      light.style.setProperty("--nebula-light-color", color.join(" "));
      fragment.append(light);
    }
  }

  field.append(fragment);
}

populateNebulaLights(document.querySelector(".nebula-knot-field"), 5);

let nebulaResizeTimer;
window.addEventListener("resize", () => {
  window.clearTimeout(nebulaResizeTimer);
  nebulaResizeTimer = window.setTimeout(updateNebulaTexture, 240);
});

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

populateGalaxies(document.querySelector(".galaxy-field"), 1);

const constellationShapes = [
  [[8, 70], [27, 42], [46, 55], [61, 22], [78, 39], [94, 12]],
  [[9, 24], [31, 18], [43, 48], [66, 54], [88, 31], [72, 82], [42, 72]],
  [[12, 78], [28, 36], [50, 16], [72, 37], [87, 78], [50, 62], [12, 78]],
];

function populateConstellations(field, count) {
  const namespace = "http://www.w3.org/2000/svg";
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const points = constellationShapes[index % constellationShapes.length];
    const x = randomBetween(8, 80);
    const y = randomBetween(0, 100);
    const width = randomBetween(110, 210);
    const tilt = randomBetween(-18, 18);

    for (const yOffset of [0, 100]) {
      const constellation = document.createElementNS(namespace, "svg");
      constellation.classList.add("constellation");
      constellation.setAttribute("viewBox", "0 0 100 100");
      constellation.style.setProperty("--constellation-x", `${x}vw`);
      constellation.style.setProperty("--constellation-y", `${y + yOffset}vh`);
      constellation.style.setProperty("--constellation-width", `${width}px`);
      constellation.style.setProperty("--constellation-tilt", `${tilt}deg`);

      const line = document.createElementNS(namespace, "polyline");
      line.setAttribute("points", points.map(([pointX, pointY]) => `${pointX},${pointY}`).join(" "));
      constellation.append(line);

      points.forEach(([pointX, pointY], pointIndex) => {
        const star = document.createElementNS(namespace, "circle");
        star.setAttribute("cx", pointX);
        star.setAttribute("cy", pointY);
        star.setAttribute("r", pointIndex % 3 === 0 ? "1.8" : "1.2");
        constellation.append(star);
      });
      fragment.append(constellation);
    }
  }

  field.append(fragment);
}

function populateCosmicDust(field, count) {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const dust = document.createElement("span");
    const depth = randomBetween(0.18, 1);
    dust.className = "cosmic-dust";
    dust.style.setProperty("--dust-x", `${randomBetween(2, 98)}vw`);
    dust.style.setProperty("--dust-size", `${0.5 + depth * 2.2}px`);
    dust.style.setProperty("--dust-drift", `${randomBetween(-12, 12) * depth}vw`);
    dust.style.setProperty("--dust-speed", `${16 - depth * 10}s`);
    dust.style.setProperty("--dust-delay", `${-randomBetween(0, 16)}s`);
    dust.style.setProperty("--dust-opacity", `${0.08 + depth * 0.34}`);
    fragment.append(dust);
  }

  field.append(fragment);
}

populateConstellations(document.querySelector(".constellation-field"), 3);
populateCosmicDust(document.querySelector(".cosmic-dust-field"), compactDevice ? 28 : 46);

function populateWarpStreaks(field, count) {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const streak = document.createElement("span");
    streak.className = "warp-streak";
    streak.style.setProperty("--warp-x", `${randomBetween(1, 99)}vw`);
    streak.style.setProperty("--warp-tilt", `${randomBetween(-4, 4)}deg`);
    streak.style.setProperty("--warp-drift", `${randomBetween(-3, 3)}vw`);
    streak.style.setProperty("--warp-length", `${randomBetween(34, 120)}px`);
    streak.style.setProperty("--warp-size", `${randomBetween(0.6, 2.2)}px`);
    streak.style.setProperty("--warp-delay", `${-randomBetween(0, 0.9)}s`);
    streak.style.setProperty("--warp-hue", `${randomBetween(188, 224)}`);
    fragment.append(streak);
  }

  field.append(fragment);
}

populateWarpStreaks(document.querySelector(".warp-overlay"), compactDevice ? 40 : 68);

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
  const isOcean = type === "rocky" && Math.random() < 0.24;
  const isCloudy = Math.random() < (type === "gas" ? 0.7 : isOcean ? 0.72 : 0.24);
  body.classList.toggle("planet--ringed", Math.random() < ringChance);
  body.classList.toggle("planet--atmosphere", Math.random() < atmosphereChance);
  body.classList.toggle("planet--ocean", isOcean);
  body.classList.toggle("planet--cloudy", isCloudy);
  body.classList.toggle("planet--stormy", isCloudy && Math.random() < 0.32);
  body.classList.toggle("planet--inhabited", (isOcean || type === "rocky") && Math.random() < 0.1);
  body.style.setProperty("--atmosphere-hue", `${type === "ice" ? hue : hue + randomBetween(12, 42)}`);
  body.style.setProperty("--atmosphere-opacity", `${randomBetween(0.28, 0.58)}`);
  body.style.setProperty("--weather-speed", `${randomBetween(18, 42)}s`);
  body.style.setProperty("--weather-delay", `${-randomBetween(0, 40)}s`);
  body.style.setProperty("--city-x", `${randomBetween(28, 72)}%`);
  body.style.setProperty("--city-y", `${randomBetween(38, 78)}%`);
}

function appendPlanetParts(body) {
  const ringBack = document.createElement("span");
  ringBack.className = "planet__ring planet__ring--back";
  const surface = document.createElement("span");
  surface.className = "planet__surface";
  const weather = document.createElement("span");
  weather.className = "planet__weather";
  const lights = document.createElement("span");
  lights.className = "planet__lights";
  surface.append(weather, lights);
  const ringFront = document.createElement("span");
  ringFront.className = "planet__ring planet__ring--front";
  body.append(ringBack, surface, ringFront);
}

function appendMoons(body, planetSize, stellarType) {
  if (planetSize < 18 || Math.random() > 0.48) return;

  const moonCount = Math.random() < 0.2 ? 2 : 1;
  for (let index = 0; index < moonCount; index += 1) {
    const moon = document.createElement("span");
    const distance = planetSize * randomBetween(0.78 + index * 0.32, 1.12 + index * 0.42);
    const verticalDistance = distance * randomBetween(0.38, 0.52);
    const moonSize = planetSize * randomBetween(0.08, 0.18);

    moon.className = "planet__moon";
    moon.style.setProperty("--moon-x", `${distance}px`);
    moon.style.setProperty("--moon-y", `${verticalDistance}px`);
    moon.style.setProperty("--moon-x-diagonal", `${distance * Math.SQRT1_2}px`);
    moon.style.setProperty("--moon-y-diagonal", `${verticalDistance * Math.SQRT1_2}px`);
    moon.style.setProperty("--moon-size", `${Math.max(2, moonSize)}px`);
    moon.style.setProperty("--moon-hue", `${stellarType.hue + randomBetween(-28, 18)}`);
    moon.style.setProperty("--moon-lightness", `${randomBetween(48, 72)}%`);
    const moonSpeed = randomBetween(58, 110);
    moon.style.setProperty("--moon-speed", `${moonSpeed}s`);
    moon.style.setProperty("--moon-delay", `${-randomBetween(0, moonSpeed)}s`);
    body.append(moon);
  }

  if (Math.random() < 0.42) {
    const eclipse = document.createElement("span");
    eclipse.className = "planet__eclipse";
    eclipse.style.setProperty("--eclipse-size", `${randomBetween(18, 38)}%`);
    eclipse.style.setProperty("--eclipse-y", `${randomBetween(18, 68)}%`);
    eclipse.style.setProperty("--eclipse-speed", `${randomBetween(9, 18)}s`);
    eclipse.style.setProperty("--eclipse-delay", `${-randomBetween(0, 18)}s`);
    body.querySelector(":scope > .planet__surface").append(eclipse);
  }
}

function createAsteroidBelt(system, depthValue, radius, stellarType) {
  const belt = document.createElement("span");
  const beltWidth = radius * 2;
  const beltHeight = radius * randomBetween(0.34, 0.5);
  const asteroidCount = Math.round((24 + depthValue * 24) * performanceScale);

  belt.className = "asteroid-belt";
  belt.style.setProperty("--belt-width", `${beltWidth}px`);
  belt.style.setProperty("--belt-height", `${beltHeight}px`);
  belt.style.setProperty("--belt-tilt", `${randomBetween(0, 180)}deg`);

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

function randomizePlanet(system, depth, initial = false, initialPhase = Math.random(), depthIndex = 0) {
  const isFar = depth === "far";
  const depthValue = initial
    ? depth === "far"
      ? depthIndex === 0 ? randomBetween(0.12, 0.3) : randomBetween(0.025, 0.12)
      : depth === "middle"
        ? randomBetween(0.32, 0.6)
        : randomBetween(0.64, 0.96)
    : Number(system.dataset.depth);
  const baseSize = 14 + depthValue * 92;
  const fullCycleTime = compactDevice ? 230 : 260;
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
  const outerOrbitRadius = orbitScale * Math.sqrt(orbitDistances.at(-1));
  const visualRadius = outerOrbitRadius * 2 + sunSize * 0.7 + baseSize;

  system.querySelectorAll(
    ".planet__companion, .asteroid-belt, .planet__moon, .planet__eclipse, .planet__sun--secondary",
  ).forEach((item) => item.remove());
  system.style.setProperty("--planet-x", `${randomBetween(10, 90)}vw`);
  system.style.setProperty("--sun-x", `${sunX}px`);
  system.style.setProperty("--sun-y", `${sunY}px`);
  system.style.setProperty("--sun-size", `${sunSize}px`);
  system.style.setProperty("--sun-hue", stellarType.hue);
  system.style.setProperty("--sun-saturation", `${stellarType.saturation}%`);
  system.style.setProperty("--sun-lightness", `${Math.max(72, stellarType.lightness)}%`);
  system.style.setProperty("--planet-clearance", `${visualRadius + 72}px`);
  system.querySelector(":scope > .planet__sun").classList.toggle("sun--flaring", Math.random() < 0.28);
  stylePlanetBody(
    system,
    baseSize * randomBetween(0.68, 1),
    primaryPoint.distance,
    stellarType,
    sunX,
    sunY,
  );
  appendMoons(system, Number.parseFloat(system.style.getPropertyValue("--planet-size")), stellarType);

  if (Math.random() < 0.08) {
    const companionStar = document.createElement("span");
    const binaryAngle = randomBetween(0, Math.PI * 2);
    const binarySeparation = sunSize * randomBetween(0.62, 0.92);
    const companionType = chooseStellarType();

    companionStar.className = "planet__sun planet__sun--secondary";
    companionStar.style.setProperty("--sun2-x", `${sunX + Math.cos(binaryAngle) * binarySeparation}px`);
    companionStar.style.setProperty("--sun2-y", `${sunY + Math.sin(binaryAngle) * binarySeparation}px`);
    companionStar.style.setProperty("--sun2-size", `${sunSize * randomBetween(0.42, 0.72)}px`);
    companionStar.style.setProperty("--sun2-hue", companionType.hue);
    companionStar.style.setProperty("--sun-hue", companionType.hue);
    companionStar.style.setProperty("--sun2-saturation", `${companionType.saturation}%`);
    companionStar.style.setProperty("--sun2-lightness", `${Math.max(74, companionType.lightness)}%`);
    companionStar.classList.toggle("sun--flaring", Math.random() < 0.34);
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
    system.style.setProperty("--planet-delay", `${-initialPhase * fullCycleTime}s`);
  }
}

const planetSystemSlots = [];

document.querySelectorAll(".planet-field").forEach((field) => {
  const depth = field.classList.contains("planet-field--far")
    ? "far"
    : field.classList.contains("planet-field--middle")
      ? "middle"
      : "near";
  const configuredCount = Number(field.dataset.planets);
  const count = compactDevice && depth === "far" ? 1 : configuredCount;

  for (let index = 0; index < count; index += 1) {
    planetSystemSlots.push({ field, depth, depthIndex: index });
  }
});

function rollPlanetPresence(planet, depth, depthIndex) {
  const appearanceChance = depth === "far"
    ? depthIndex === 0 ? 0.76 : 0.28
    : depth === "middle" ? 0.3 : 0.08;

  planet.classList.toggle("planet--absent", Math.random() >= appearanceChance);
}

const planetScenePhase = Math.random();

planetSystemSlots.forEach(({ field, depth, depthIndex }) => {
  const planet = document.createElement("span");
  planet.className = "planet";

  const sun = document.createElement("span");
  sun.className = "planet__sun";
  planet.append(sun);
  appendPlanetParts(planet);

  const phaseOffset = depth === "middle" ? 0.5 : depth === "far" ? 0.02 + depthIndex * 0.1 : 0;
  const initialPhase = (planetScenePhase + phaseOffset) % 1;
  randomizePlanet(planet, depth, true, initialPhase, depthIndex);
  rollPlanetPresence(planet, depth, depthIndex);
  planet.addEventListener("animationiteration", (event) => {
    if (event.target === planet && event.animationName === "planet-fall") {
      randomizePlanet(planet, depth);
      rollPlanetPresence(planet, depth, depthIndex);
    }
  });
  field.append(planet);
});

const scene = document.querySelector(".scene");
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
let pulsarHudActive = false;
let blackHoleHudActive = false;

function updateRocketLighting(timestamp) {
  if (timestamp - lastLightingFrame > (compactDevice ? 66 : 33)) {
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

    document.querySelectorAll(".planet:not(.planet--absent) .planet__sun").forEach((sun) => {
      const rect = sun.getBoundingClientRect();
      const sunX = rect.left + rect.width * 0.5;
      const sunY = rect.top + rect.height * 0.5;
      const deltaX = sunX - rocketX;
      const deltaY = sunY - rocketY;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const proximity = Math.max(0, 1 - distance / influenceRadius);
      const angularSize = Math.min(1.35, rect.width / 64);
      const system = sun.closest(".planet");
      const field = sun.closest(".planet-field");
      const systemOpacity = Number.parseFloat(getComputedStyle(system).opacity);
      const fieldOpacity = field ? Number.parseFloat(getComputedStyle(field).opacity) : 1;
      const influence = proximity * proximity * angularSize * systemOpacity * fieldOpacity;

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
    const pulsarRect = pulsar.getBoundingClientRect();
    const pulsarX = pulsarRect.left + pulsarRect.width * 0.5;
    const pulsarY = pulsarRect.top + pulsarRect.height * 0.5;
    const pulsarDirection = Math.atan2(rocketY - pulsarY, rocketX - pulsarX);
    const beamAngle = ((timestamp % 48000) / 48000) * Math.PI * 2;
    const beamAlignment = Math.abs(Math.cos(pulsarDirection - beamAngle)) ** 8;
    const pulsarOpacity = Number.parseFloat(getComputedStyle(pulsar).opacity);
    const pulsarDistance = Math.hypot(rocketX - pulsarX, rocketY - pulsarY);
    const pulsarProximity = Math.max(0, 1 - pulsarDistance / (influenceRadius * 1.25));
    const pulsarFlash = Math.min(0.32, beamAlignment * pulsarOpacity * (0.12 + pulsarProximity * 0.3));

    if (pulsarOpacity > 0.2 && !pulsarHudActive) {
      pulsarHudActive = true;
      showHudEvent("SIGNAL // PERIODIC SOURCE", "Pulsar detected", "Beam timing synchronized");
    } else if (pulsarOpacity < 0.04) {
      pulsarHudActive = false;
    }

    const blackHole = document.querySelector(".black-hole");
    const visibleBlackHole = blackHole
      ? Number.parseFloat(getComputedStyle(blackHole).opacity) > 0.2
      : false;
    if (visibleBlackHole && !blackHoleHudActive) {
      blackHoleHudActive = true;
      showHudEvent("GRAVITY // LENSING", "Compact mass ahead", "Trajectory margin increased");
    } else if (!visibleBlackHole) {
      blackHoleHudActive = false;
    }

    rocket.style.setProperty("--stellar-rim-x", `${rimX}%`);
    rocket.style.setProperty("--stellar-rim-y", `${rimY}%`);
    rocket.style.setProperty("--stellar-rim-hue", `${dominantHue}`);
    rocket.style.setProperty("--stellar-rim-intensity", `${rimIntensity}`);
    rocket.style.setProperty("--stellar-light-x", `${lightX}%`);
    rocket.style.setProperty("--stellar-light-y", `${lightY}%`);
    rocket.style.setProperty("--stellar-light-hue", `${frontHue}`);
    rocket.style.setProperty("--stellar-light-intensity", `${intensity}`);
    rocket.style.setProperty("--stellar-light-soft-intensity", `${intensity * 0.3}`);
    rocket.style.setProperty("--pulsar-light-intensity", `${pulsarFlash}`);
  }

  window.requestAnimationFrame(updateRocketLighting);
}

window.requestAnimationFrame(updateRocketLighting);

scene.style.setProperty("--nebula-light-color", nebulaPalette[1].join(" "));
scene.style.setProperty("--nebula-accent-color", nebulaPalette[3].join(" "));
const eventHud = document.querySelector(".event-hud");
const eventQueue = [];
let eventHudBusy = false;

function showHudEvent(code, title, detail) {
  eventQueue.push({ code, title, detail });
  if (eventHudBusy) return;

  const displayNextEvent = () => {
    const event = eventQueue.shift();
    if (!event) {
      eventHudBusy = false;
      return;
    }

    eventHudBusy = true;
    eventHud.querySelector(".event-hud__code").textContent = event.code;
    eventHud.querySelector(".event-hud__title").textContent = event.title;
    eventHud.querySelector(".event-hud__detail").textContent = event.detail;
    eventHud.classList.add("event-hud--visible");

    window.setTimeout(() => {
      eventHud.classList.remove("event-hud--visible");
      window.setTimeout(displayNextEvent, 900);
    }, 4800);
  };

  displayNextEvent();
}

function scheduleNebulaEncounter(visible, initial = false) {
  scene.classList.toggle("scene--nebula-visible", visible);
  if (visible && !initial) {
    showHudEvent("ENVIRONMENT // DUST", "Nebula boundary", "Optical attenuation rising");
  }
  const duration = visible
    ? randomBetween(55000, 105000)
    : initial
      ? randomBetween(18000, 60000)
      : randomBetween(100000, 220000);

  window.setTimeout(() => scheduleNebulaEncounter(!visible), duration);
}

scheduleNebulaEncounter(Math.random() < 0.33, true);

function scheduleWarp(initial = false) {
  const wait = initial ? randomBetween(70000, 120000) : randomBetween(140000, 250000);
  window.setTimeout(() => {
    if (!document.hidden && !reducedMotion.matches) {
      scene.classList.add("scene--warp");
      showHudEvent("DRIVE // TRANSIENT", "Warp corridor stable", "Velocity envelope expanded");
      window.setTimeout(() => scene.classList.remove("scene--warp"), 6500);
    }
    scheduleWarp();
  }, wait);
}

scheduleWarp(true);

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
    blackHole.style.setProperty("--black-hole-hue", `${randomBetween(348, 372)}`);
    blackHole.style.setProperty("--black-hole-speed", `${fullCycleTime}s`);
    blackHole.style.setProperty("--black-hole-delay", `${-randomBetween(0, fullCycleTime)}s`);
    field.append(blackHole);
  }
});

function launchPlanetFlyby() {
  if (document.hidden || reducedMotion.matches) return;

  const field = document.querySelector(".planet-flyby-field");
  const flyby = document.createElement("span");
  const size = Math.min(window.innerWidth, window.innerHeight) * randomBetween(0.38, 0.68);
  const typeRoll = Math.random();
  const type = typeRoll < 0.34 ? "ocean" : typeRoll < 0.62 ? "gas" : "rocky";
  const hue = type === "ocean"
    ? randomBetween(184, 215)
    : type === "gas"
      ? randomBetween(22, 58)
      : randomBetween(12, 42);
  const hasAtmosphere = type !== "rocky" || Math.random() < 0.46;

  flyby.className = `planet-flyby planet-flyby--${type}${hasAtmosphere ? " planet-flyby--atmosphere" : ""}`;
  flyby.style.setProperty("--flyby-x", `${randomBetween(8, 92)}vw`);
  flyby.style.setProperty("--flyby-drift", `${randomBetween(-24, 24)}vw`);
  flyby.style.setProperty("--flyby-size", `${size}px`);
  flyby.style.setProperty("--flyby-hue", `${hue}`);
  flyby.style.setProperty("--flyby-light-x", `${randomBetween(18, 42)}%`);
  flyby.style.setProperty("--flyby-light-y", `${randomBetween(18, 38)}%`);
  flyby.style.setProperty("--flyby-feature-x1", `${randomBetween(22, 42)}%`);
  flyby.style.setProperty("--flyby-feature-y1", `${randomBetween(28, 68)}%`);
  flyby.style.setProperty("--flyby-feature-x2", `${randomBetween(54, 78)}%`);
  flyby.style.setProperty("--flyby-feature-y2", `${randomBetween(24, 72)}%`);
  flyby.style.setProperty("--flyby-feature-x3", `${randomBetween(30, 72)}%`);
  flyby.style.setProperty("--flyby-feature-y3", `${randomBetween(56, 82)}%`);
  flyby.style.setProperty("--flyby-atmosphere-hue", `${type === "ocean" ? randomBetween(188, 210) : type === "gas" ? hue + 8 : randomBetween(18, 205)}`);
  flyby.style.setProperty("--flyby-weather-speed", `${randomBetween(28, 52)}s`);
  flyby.style.setProperty("--flyby-tilt", `${randomBetween(-12, 12)}deg`);
  flyby.style.setProperty("--flyby-speed", `${randomBetween(34, 58)}s`);
  const surface = document.createElement("span");
  const terrain = document.createElement("i");
  const weather = document.createElement("i");
  const terrainCount = compactDevice ? (type === "gas" ? 4 : 6) : (type === "gas" ? 6 : 10);

  surface.className = "planet-flyby__surface";
  terrain.className = "planet-flyby__terrain";
  weather.className = "planet-flyby__weather";

  for (let index = 0; index < terrainCount; index += 1) {
    const detail = document.createElement("b");
    const points = Array.from({ length: 12 }, (_, pointIndex) => {
      const angle = (pointIndex / 12) * Math.PI * 2;
      const radius = randomBetween(0.58, 1);
      const x = 50 + Math.cos(angle) * radius * 49;
      const y = 50 + Math.sin(angle) * radius * 47;
      return `${x.toFixed(1)}% ${y.toFixed(1)}%`;
    });

    detail.className = "planet-flyby__terrain-detail";
    detail.style.setProperty("--terrain-x", `${randomBetween(8, 92)}%`);
    detail.style.setProperty("--terrain-y", `${randomBetween(8, 92)}%`);
    detail.style.setProperty("--terrain-width", `${randomBetween(type === "gas" ? 24 : 12, type === "gas" ? 52 : 38)}%`);
    detail.style.setProperty("--terrain-height", `${randomBetween(10, 34)}%`);
    detail.style.setProperty("--terrain-rotation", `${randomBetween(-38, 38)}deg`);
    detail.style.setProperty("--terrain-hue", `${type === "ocean" ? randomBetween(72, 122) : type === "gas" ? hue + randomBetween(-18, 18) : hue + randomBetween(-12, 14)}`);
    detail.style.setProperty("--terrain-shape", `polygon(${points.join(", ")})`);
    terrain.append(detail);
  }

  surface.append(terrain, weather);
  flyby.append(surface);
  flyby.addEventListener("animationend", () => flyby.remove(), { once: true });
  field.append(flyby);
  showHudEvent("PROXIMITY // LARGE BODY", "Planetary flyby", "Parallax compensation active");
}

function schedulePlanetFlyby(initial = false) {
  const wait = initial ? randomBetween(50000, 100000) : randomBetween(150000, 290000);
  window.setTimeout(() => {
    launchPlanetFlyby();
    schedulePlanetFlyby();
  }, wait);
}

schedulePlanetFlyby(true);

const pulsar = document.createElement("span");
const pulsarSpeed = randomBetween(480, 720);
pulsar.className = "pulsar";
pulsar.style.setProperty("--pulsar-x", `${randomBetween(12, 88)}vw`);
pulsar.style.setProperty("--pulsar-size", `${randomBetween(10, 18)}px`);
pulsar.style.setProperty("--pulsar-speed", `${pulsarSpeed}s`);
pulsar.style.setProperty("--pulsar-delay", `${-randomBetween(0, pulsarSpeed)}s`);
pulsar.innerHTML = '<span class="pulsar__beam"></span><span class="pulsar__core"></span>';
document.querySelector(".pulsar-field").append(pulsar);

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
