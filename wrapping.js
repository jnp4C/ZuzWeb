const GIFT_MESSAGE = "Hi Zuzana! I hope you are ready to unwrap your gift.";
const PAPER_COLORS = {
  outer: "#5a7d75",
  final: "#415f58",
};
const COMPLETION_THRESHOLD = 0.64;
const GIFT_COMPLETION_KEY = "zuz-birthday-gift-unwrapped-v1";

const experience = document.getElementById("giftExperience");
const outerWrap = document.getElementById("outerWrap");
const finalWrap = document.getElementById("finalWrap");
const bouquetLayer = document.getElementById("bouquetLayer");
const handoffLayer = document.getElementById("handoffLayer");
const introButton = document.getElementById("unwrapIntro");
const typedMessage = document.getElementById("typedGiftMessage");
const continueButton = document.getElementById("continueGift");
const bouquetSelection = document.getElementById("bouquetSelection");
const offeredFlower = document.getElementById("offeredFlower");
const handoffPrompt = document.getElementById("handoffPrompt");
const handoffContinue = document.getElementById("handoffContinue");
const receivedCharacter = document.querySelector(".received-character");
const handoffCharacter = document.querySelector(".handoff-character");
const flowerChoices = Array.from(document.querySelectorAll(".flower-choice"));
const replayGift = document.getElementById("replayGift");

function hasCompletedGift() {
  try {
    return window.localStorage.getItem(GIFT_COMPLETION_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberCompletedGift() {
  try {
    window.localStorage.setItem(GIFT_COMPLETION_KEY, "true");
  } catch {
    // The experience still completes when storage is unavailable.
  }
}

replayGift?.addEventListener("click", () => {
  try {
    window.localStorage.removeItem(GIFT_COMPLETION_KEY);
  } catch {
    // Reloading can still replay when storage is unavailable.
  }
  window.location.reload();
});

if (hasCompletedGift()) {
  experience.remove();
} else {

document.body.classList.add("gift-is-active");

function paintPaper(context, width, height, color) {
  context.globalCompositeOperation = "source-over";
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);

  // A tiny procedural tile adds paper grain without introducing an image asset.
  const texture = document.createElement("canvas");
  const textureSize = 160;
  texture.width = textureSize;
  texture.height = textureSize;
  const textureContext = texture.getContext("2d");
  const grain = textureContext.createImageData(textureSize, textureSize);
  let seed = 7417;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let index = 0; index < grain.data.length; index += 4) {
    const lightGrain = random() > 0.48;
    const value = lightGrain ? 255 : 0;
    grain.data[index] = value;
    grain.data[index + 1] = value;
    grain.data[index + 2] = value;
    grain.data[index + 3] = 3 + Math.floor(random() * 7);
  }
  textureContext.putImageData(grain, 0, 0);

  textureContext.lineWidth = 0.55;
  for (let index = 0; index < 34; index += 1) {
    const y = random() * textureSize;
    const length = 8 + random() * 44;
    textureContext.strokeStyle = random() > 0.5
      ? "rgba(255,255,255,0.055)"
      : "rgba(0,0,0,0.035)";
    textureContext.beginPath();
    textureContext.moveTo(random() * textureSize, y);
    textureContext.lineTo(random() * textureSize + length, y + random() * 2 - 1);
    textureContext.stroke();
  }

  context.fillStyle = context.createPattern(texture, "repeat");
  context.fillRect(0, 0, width, height);
}

function createScratchLayer(stage, color, onComplete) {
  const canvas = stage.querySelector(".wrap-canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const progressBar = stage.querySelector(".unwrap-progress span");
  const instruction = stage.querySelector(".wrap-instruction");
  let enabled = false;
  let drawing = false;
  let completed = false;
  let previousPoint = null;
  let moveCount = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    paintPaper(context, window.innerWidth, window.innerHeight, color);
  }

  function pointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function stampRaggedBrush(point, brushSize) {
    const vertices = 20;
    const baseRadius = brushSize * 0.5;

    context.beginPath();
    for (let index = 0; index < vertices; index += 1) {
      const angle = (index / vertices) * Math.PI * 2;
      const alternatingEdge = index % 2 === 0 ? 1.08 : 0.78;
      const radius = baseRadius * alternatingEdge * (0.88 + Math.random() * 0.24);
      const x = point.x + Math.cos(angle) * radius;
      const y = point.y + Math.sin(angle) * radius;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();

    // Uneven edge bites make the trail resemble torn paper instead of circles.
    for (let index = 0; index < 7; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = baseRadius * (0.72 + Math.random() * 0.42);
      const fragmentWidth = brushSize * (0.06 + Math.random() * 0.1);
      const fragmentHeight = fragmentWidth * (0.45 + Math.random());
      context.save();
      context.translate(
        point.x + Math.cos(angle) * distance,
        point.y + Math.sin(angle) * distance,
      );
      context.rotate(angle + Math.random() - 0.5);
      context.fillRect(-fragmentWidth / 2, -fragmentHeight / 2, fragmentWidth, fragmentHeight);
      context.restore();
    }
  }

  function eraseBetween(from, to) {
    const brushSize = Math.max(68, Math.min(window.innerWidth, window.innerHeight) * 0.125);
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const spacing = brushSize * 0.18;
    const steps = Math.max(1, Math.ceil(distance / spacing));
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.globalAlpha = 1;
    context.fillStyle = "#000";
    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      stampRaggedBrush({
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress,
      }, brushSize);
    }
    context.restore();
  }

  function measureClearedArea() {
    const sampleWidth = 80;
    const sampleHeight = Math.max(40, Math.round(80 * canvas.height / canvas.width));
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleContext.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
    const pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let transparent = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] < 80) transparent += 1;
    }
    return transparent / (pixels.length / 4);
  }

  function updateProgress() {
    const cleared = measureClearedArea();
    progressBar.style.width = `${Math.min(cleared / COMPLETION_THRESHOLD, 1) * 100}%`;
    if (cleared >= COMPLETION_THRESHOLD && !completed) {
      completed = true;
      enabled = false;
      stage.classList.add("is-dismissed");
      window.setTimeout(onComplete, 650);
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!enabled || completed) return;
    drawing = true;
    stage.classList.add("is-tearing");
    previousPoint = pointFromEvent(event);
    canvas.setPointerCapture(event.pointerId);
    instruction?.classList.add("is-fading");
    eraseBetween(previousPoint, previousPoint);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing || !enabled || completed) return;
    const point = pointFromEvent(event);
    eraseBetween(previousPoint, point);
    previousPoint = point;
    moveCount += 1;
    if (moveCount % 6 === 0) updateProgress();
  });

  function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    stage.classList.remove("is-tearing");
    previousPoint = null;
    updateProgress();
  }

  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
  window.addEventListener("resize", resize);
  resize();

  return {
    enable() {
      enabled = true;
      instruction.hidden = false;
    },
  };
}

function typeGiftMessage() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    typedMessage.textContent = GIFT_MESSAGE;
    introButton.classList.add("is-ready");
    return;
  }

  let index = 0;
  const timer = window.setInterval(() => {
    index += 1;
    typedMessage.textContent = GIFT_MESSAGE.slice(0, index);
    if (index >= GIFT_MESSAGE.length) {
      window.clearInterval(timer);
      introButton.classList.add("is-ready");
    }
  }, 48);
}

const outerScratch = createScratchLayer(outerWrap, PAPER_COLORS.outer, () => {
  bouquetLayer.setAttribute("aria-hidden", "false");
});

const finalScratch = createScratchLayer(finalWrap, PAPER_COLORS.final, () => {
  rememberCompletedGift();
  experience.classList.add("is-complete");
  document.body.classList.remove("gift-is-active");
  window.setTimeout(() => experience.remove(), 750);
});

introButton.addEventListener("click", () => {
  introButton.hidden = true;
  outerScratch.enable();
});

flowerChoices.forEach((choice) => {
  choice.addEventListener("click", () => {
    flowerChoices.forEach((item) => item.setAttribute("aria-pressed", `${item === choice}`));
    experience.dataset.selectedFlower = choice.dataset.flower;
    bouquetSelection.textContent = `${choice.dataset.flower} selected for your bouquet.`;
    continueButton.disabled = false;
  });
});

continueButton.addEventListener("click", () => {
  bouquetLayer.classList.add("is-dismissed");
  bouquetLayer.setAttribute("aria-hidden", "true");
  handoffLayer.classList.remove("is-dismissed");
  handoffLayer.classList.add("is-playing");
  handoffLayer.setAttribute("aria-hidden", "false");

  const flowerKey = {
    "Spring bouquet": "spring",
    "Bright bouquet": "bright",
    "Red roses": "roses",
    Succulent: "succulent",
  }[experience.dataset.selectedFlower];
  offeredFlower.dataset.flower = flowerKey || "spring";

  window.setTimeout(() => {
    handoffLayer.classList.add("is-offering");
    handoffPrompt.textContent = "Click the flower to receive it.";
  }, 1300);
});

offeredFlower.addEventListener("click", () => {
  const flowerStart = offeredFlower.getBoundingClientRect();
  const stageBounds = handoffLayer.getBoundingClientRect();
  const boyBounds = handoffCharacter.getBoundingClientRect();

  // Both portrait windows share an exact top edge and height for a clean knee crop.
  receivedCharacter.style.top = `${boyBounds.top - stageBounds.top}px`;
  receivedCharacter.style.bottom = "auto";

  // Measure Zuz's final position without showing it, then reset for animation.
  receivedCharacter.style.transition = "none";
  handoffLayer.classList.add("is-received");
  const receiverBounds = receivedCharacter.getBoundingClientRect();
  handoffLayer.classList.remove("is-received");
  void receivedCharacter.offsetWidth;
  receivedCharacter.style.removeProperty("transition");

  handoffLayer.classList.remove("is-offering");
  offeredFlower.style.left = `${flowerStart.left - stageBounds.left}px`;
  offeredFlower.style.top = `${flowerStart.top - stageBounds.top}px`;
  offeredFlower.style.width = `${flowerStart.width}px`;
  offeredFlower.style.opacity = "1";
  offeredFlower.style.transform = "scale(1)";
  handoffLayer.append(offeredFlower);
  void offeredFlower.offsetWidth;

  window.requestAnimationFrame(() => {
    handoffLayer.classList.add("is-received");
    offeredFlower.style.left = `${receiverBounds.left - stageBounds.left + receiverBounds.width * 0.46 - flowerStart.width * 0.5}px`;
    offeredFlower.style.top = `${receiverBounds.top - stageBounds.top + receiverBounds.height * 0.62 - flowerStart.height * 0.5}px`;
    offeredFlower.style.transform = "scale(0.72)";
  });
  handoffPrompt.textContent = "Here it comes...";
  window.setTimeout(() => {
    handoffPrompt.textContent = "I hope they smell as good as the real ones XD";
    handoffContinue.hidden = false;
  }, 720);
});

handoffContinue.addEventListener("click", () => {
  // Make the final paper fully opaque before the handoff fades, avoiding a flash
  // of the portfolio between the two gift stages.
  finalWrap.classList.add("is-presenting");
  finalWrap.classList.remove("is-dismissed");
  finalWrap.setAttribute("aria-hidden", "false");
  void finalWrap.offsetWidth;
  finalScratch.enable();

  window.requestAnimationFrame(() => {
    handoffLayer.classList.add("is-dismissed");
    handoffLayer.setAttribute("aria-hidden", "true");
    window.setTimeout(() => finalWrap.classList.remove("is-presenting"), 700);
  });
});

finalWrap.classList.add("is-dismissed");
typeGiftMessage();
}
