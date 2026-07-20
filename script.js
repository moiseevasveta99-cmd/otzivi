const LINKS = {
  group: "https://t.me/+gQrkd_lUbzlkNTMy",
  channel: "https://t.me/+bXuSPMG4UsEwN2Fi",
  manager: "https://t.me/netprofittttt",
  owner: "https://t.me/m/QJClCOYiMmYy",
};

function initShapeGrid(canvas) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const direction = canvas.dataset.direction || "right";
  const speed = Math.max(Number(canvas.dataset.speed) || 1, 0.1);
  const borderColor = canvas.dataset.border || "#999";
  const squareSize = Math.max(Number(canvas.dataset.size) || 40, 16);
  const hoverFillColor = canvas.dataset.hoverFill || "#222";
  const shape = canvas.dataset.shape || "square";
  const hoverTrailAmount = Math.max(Number(canvas.dataset.trail) || 0, 0);

  let animationFrame = 0;
  let hoveredCell = null;
  const trailCells = [];
  const cellOpacities = new Map();
  const gridOffset = { x: 0, y: 0 };

  const isHex = shape === "hexagon";
  const isTriangle = shape === "triangle";
  const isCircle = shape === "circle";
  const hexHoriz = squareSize * 1.5;
  const hexVert = squareSize * Math.sqrt(3);

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.max(Math.floor(bounds.width * ratio), 1);
    canvas.height = Math.max(Math.floor(bounds.height * ratio), 1);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawHex(cx, cy, size) {
    context.beginPath();
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI / 3) * index;
      const vx = cx + size * Math.cos(angle);
      const vy = cy + size * Math.sin(angle);
      if (index === 0) {
        context.moveTo(vx, vy);
      } else {
        context.lineTo(vx, vy);
      }
    }
    context.closePath();
  }

  function drawCircle(cx, cy, size) {
    context.beginPath();
    context.arc(cx, cy, size / 2, 0, Math.PI * 2);
    context.closePath();
  }

  function drawTriangle(cx, cy, size, flip) {
    context.beginPath();
    if (flip) {
      context.moveTo(cx, cy + size / 2);
      context.lineTo(cx + size / 2, cy - size / 2);
      context.lineTo(cx - size / 2, cy - size / 2);
    } else {
      context.moveTo(cx, cy - size / 2);
      context.lineTo(cx + size / 2, cy + size / 2);
      context.lineTo(cx - size / 2, cy + size / 2);
    }
    context.closePath();
  }

  function updateCellOpacities() {
    const targets = new Map();

    if (hoveredCell) {
      targets.set(`${hoveredCell.x},${hoveredCell.y}`, 1);
    }

    if (hoverTrailAmount > 0) {
      trailCells.forEach((cell, index) => {
        const key = `${cell.x},${cell.y}`;
        if (!targets.has(key)) {
          targets.set(key, (trailCells.length - index) / (trailCells.length + 1));
        }
      });
    }

    targets.forEach((_, key) => {
      if (!cellOpacities.has(key)) {
        cellOpacities.set(key, 0);
      }
    });

    Array.from(cellOpacities.entries()).forEach(([key, opacity]) => {
      const targetOpacity = targets.get(key) || 0;
      const nextOpacity = opacity + (targetOpacity - opacity) * 0.15;
      if (nextOpacity < 0.005) {
        cellOpacities.delete(key);
      } else {
        cellOpacities.set(key, nextOpacity);
      }
    });
  }

  function drawGrid() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;

    if (isHex) {
      const colShift = Math.floor(gridOffset.x / hexHoriz);
      const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
      const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;
      const columns = Math.ceil(width / hexHoriz) + 3;
      const rows = Math.ceil(height / hexVert) + 3;

      for (let col = -2; col < columns; col += 1) {
        for (let row = -2; row < rows; row += 1) {
          const cx = col * hexHoriz + offsetX;
          const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;
          const key = `${col},${row}`;
          const alpha = cellOpacities.get(key);

          if (alpha) {
            context.globalAlpha = alpha;
            drawHex(cx, cy, squareSize);
            context.fillStyle = hoverFillColor;
            context.fill();
            context.globalAlpha = 1;
          }

          drawHex(cx, cy, squareSize);
          context.strokeStyle = borderColor;
          context.stroke();
        }
      }
    } else if (isTriangle) {
      const halfWidth = squareSize / 2;
      const colShift = Math.floor(gridOffset.x / halfWidth);
      const rowShift = Math.floor(gridOffset.y / squareSize);
      const offsetX = ((gridOffset.x % halfWidth) + halfWidth) % halfWidth;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const columns = Math.ceil(width / halfWidth) + 4;
      const rows = Math.ceil(height / squareSize) + 4;

      for (let col = -2; col < columns; col += 1) {
        for (let row = -2; row < rows; row += 1) {
          const cx = col * halfWidth + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;
          const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;
          const key = `${col},${row}`;
          const alpha = cellOpacities.get(key);

          if (alpha) {
            context.globalAlpha = alpha;
            drawTriangle(cx, cy, squareSize, flip);
            context.fillStyle = hoverFillColor;
            context.fill();
            context.globalAlpha = 1;
          }

          drawTriangle(cx, cy, squareSize, flip);
          context.strokeStyle = borderColor;
          context.stroke();
        }
      }
    } else if (isCircle) {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const columns = Math.ceil(width / squareSize) + 3;
      const rows = Math.ceil(height / squareSize) + 3;

      for (let col = -2; col < columns; col += 1) {
        for (let row = -2; row < rows; row += 1) {
          const cx = col * squareSize + squareSize / 2 + offsetX;
          const cy = row * squareSize + squareSize / 2 + offsetY;
          const key = `${col},${row}`;
          const alpha = cellOpacities.get(key);

          if (alpha) {
            context.globalAlpha = alpha;
            drawCircle(cx, cy, squareSize);
            context.fillStyle = hoverFillColor;
            context.fill();
            context.globalAlpha = 1;
          }

          drawCircle(cx, cy, squareSize);
          context.strokeStyle = borderColor;
          context.stroke();
        }
      }
    } else {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      const columns = Math.ceil(width / squareSize) + 3;
      const rows = Math.ceil(height / squareSize) + 3;

      for (let col = -2; col < columns; col += 1) {
        for (let row = -2; row < rows; row += 1) {
          const startX = col * squareSize + offsetX;
          const startY = row * squareSize + offsetY;
          const key = `${col},${row}`;
          const alpha = cellOpacities.get(key);

          if (alpha) {
            context.globalAlpha = alpha;
            context.fillStyle = hoverFillColor;
            context.fillRect(startX, startY, squareSize, squareSize);
            context.globalAlpha = 1;
          }

          context.strokeStyle = borderColor;
          context.strokeRect(startX, startY, squareSize, squareSize);
        }
      }
    }
  }

  function detectCell(mouseX, mouseY) {
    if (isHex) {
      const colShift = Math.floor(gridOffset.x / hexHoriz);
      const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
      const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;
      const adjustedX = mouseX - offsetX;
      const adjustedY = mouseY - offsetY;
      const col = Math.round(adjustedX / hexHoriz);
      const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0;
      const row = Math.round((adjustedY - rowOffset) / hexVert);
      return { x: col, y: row };
    }

    if (isTriangle) {
      const halfWidth = squareSize / 2;
      const offsetX = ((gridOffset.x % halfWidth) + halfWidth) % halfWidth;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      return {
        x: Math.round((mouseX - offsetX) / halfWidth),
        y: Math.floor((mouseY - offsetY) / squareSize),
      };
    }

    if (isCircle) {
      const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
      const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
      return {
        x: Math.round((mouseX - offsetX) / squareSize),
        y: Math.round((mouseY - offsetY) / squareSize),
      };
    }

    const offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
    const offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
    return {
      x: Math.floor((mouseX - offsetX) / squareSize),
      y: Math.floor((mouseY - offsetY) / squareSize),
    };
  }

  function pushTrail() {
    if (!hoveredCell || hoverTrailAmount <= 0) {
      return;
    }

    trailCells.unshift({ ...hoveredCell });
    if (trailCells.length > hoverTrailAmount) {
      trailCells.length = hoverTrailAmount;
    }
  }

  function handlePointerMove(event) {
    const bounds = canvas.getBoundingClientRect();
    const nextCell = detectCell(event.clientX - bounds.left, event.clientY - bounds.top);

    if (!hoveredCell || hoveredCell.x !== nextCell.x || hoveredCell.y !== nextCell.y) {
      pushTrail();
      hoveredCell = nextCell;
    }
  }

  function handlePointerLeave() {
    pushTrail();
    hoveredCell = null;
  }

  function tick() {
    const wrapX = isHex ? hexHoriz * 2 : squareSize;
    const wrapY = isHex ? hexVert : isTriangle ? squareSize * 2 : squareSize;

    switch (direction) {
      case "right":
        gridOffset.x = (gridOffset.x - speed + wrapX) % wrapX;
        break;
      case "left":
        gridOffset.x = (gridOffset.x + speed + wrapX) % wrapX;
        break;
      case "up":
        gridOffset.y = (gridOffset.y + speed + wrapY) % wrapY;
        break;
      case "down":
        gridOffset.y = (gridOffset.y - speed + wrapY) % wrapY;
        break;
      case "diagonal":
        gridOffset.x = (gridOffset.x - speed + wrapX) % wrapX;
        gridOffset.y = (gridOffset.y - speed + wrapY) % wrapY;
        break;
      default:
        break;
    }

    updateCellOpacities();
    drawGrid();
    animationFrame = window.requestAnimationFrame(tick);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  animationFrame = window.requestAnimationFrame(tick);
}

function initMagicBento(container) {
  if (!container) {
    return;
  }

  const cards = container.querySelectorAll("[data-bento-card]");
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  cards.forEach((card) => {
    function resetCard() {
      card.style.setProperty("--bento-glow-opacity", "0");
      card.style.setProperty("--bento-glow-x", "50%");
      card.style.setProperty("--bento-glow-y", "50%");
      card.style.transform = "";
    }

    function spawnParticle(x, y) {
      if (isMobile) {
        return;
      }

      const particle = document.createElement("span");
      particle.className = "magic-bento-particle";
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      card.appendChild(particle);

      const driftX = (Math.random() - 0.5) * 50;
      const driftY = -30 - Math.random() * 30;
      const animation = particle.animate(
        [
          { transform: "translate3d(0, 0, 0) scale(0.6)", opacity: 0 },
          { transform: "translate3d(0, -8px, 0) scale(1)", opacity: 1, offset: 0.2 },
          { transform: `translate3d(${driftX}px, ${driftY}px, 0) scale(0.4)`, opacity: 0 },
        ],
        {
          duration: 800 + Math.random() * 600,
          easing: "ease-out",
        },
      );

      animation.onfinish = () => {
        particle.remove();
      };
    }

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;

      card.style.setProperty("--bento-glow-opacity", "1");
      card.style.setProperty("--bento-glow-x", `${px}%`);
      card.style.setProperty("--bento-glow-y", `${py}%`);

      if (!isMobile) {
        const rotateY = ((x / rect.width) - 0.5) * 8;
        const rotateX = (0.5 - (y / rect.height)) * 8;
        const shiftX = ((x / rect.width) - 0.5) * 8;
        const shiftY = ((y / rect.height) - 0.5) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${shiftX}px, ${shiftY}px, 0)`;
      }
    });

    card.addEventListener("pointerenter", () => {
      card.style.setProperty("--bento-glow-opacity", "1");
    });

    card.addEventListener("pointerleave", resetCard);

    card.addEventListener("click", (event) => {
      const rect = card.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      spawnParticle(localX, localY);
      spawnParticle(localX + 12, localY - 10);
      spawnParticle(localX - 10, localY + 8);
    });
  });
}

function initMagnet(wrapper) {
  if (!wrapper) {
    return;
  }

  const isDisabled = window.matchMedia("(max-width: 768px)").matches;
  const padding = Number(wrapper.dataset.padding) || 100;
  const magnetStrength = Number(wrapper.dataset.strength) || 2;
  const activeTransition = "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)";
  const inactiveTransition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
  const inner = wrapper.firstElementChild;

  if (!inner) {
    return;
  }

  inner.classList.add("magnet__inner");

  if (isDisabled) {
    inner.style.transform = "translate3d(0, 0, 0)";
    return;
  }

  function resetMagnet() {
    inner.style.transition = inactiveTransition;
    inner.style.transform = "translate3d(0, 0, 0)";
  }

  function handleMouseMove(event) {
    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const insideX = localX >= -padding && localX <= rect.width + padding;
    const insideY = localY >= -padding && localY <= rect.height + padding;

    if (!insideX || !insideY) {
      resetMagnet();
      return;
    }

    const offsetX = (event.clientX - centerX) / magnetStrength;
    const offsetY = (event.clientY - centerY) / magnetStrength;
    inner.style.transition = activeTransition;
    inner.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  }

  wrapper.addEventListener("mousemove", handleMouseMove);
  wrapper.addEventListener("mouseenter", handleMouseMove);
  wrapper.addEventListener("mouseleave", resetMagnet);
}

function initSpecularButton(button) {
  if (!button) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    button.style.setProperty("--specular-opacity", "0.22");
    return;
  }

  const proximity = Number(button.dataset.proximity) || 190;

  function updateLight(event) {
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const localX = ((event.clientX - rect.left) / rect.width) * 100;
    const localY = ((event.clientY - rect.top) / rect.height) * 100;
    const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
    const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
    const distance = Math.hypot(dx, dy);
    const raw = Math.max(0, 1 - distance / proximity);
    const strength = raw * raw * (3 - 2 * raw);
    const angle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI + 90;

    button.style.setProperty("--specular-x", `${Math.max(0, Math.min(100, localX)).toFixed(1)}%`);
    button.style.setProperty("--specular-y", `${Math.max(0, Math.min(100, localY)).toFixed(1)}%`);
    button.style.setProperty("--specular-rotate", `${angle.toFixed(1)}deg`);
    button.style.setProperty("--specular-opacity", (0.22 + strength * 0.62).toFixed(3));
  }

  window.addEventListener("pointermove", updateLight, { passive: true });
}

function initLineSidebar(sidebar) {
  if (!sidebar) {
    return;
  }

  const items = Array.from(sidebar.querySelectorAll(".line-sidebar__item"));
  if (items.length === 0) {
    return;
  }

  function easeSmooth(progress) {
    return progress * progress * (3 - 2 * progress);
  }

  function setEffects(pointerY) {
    items.forEach((item, index) => {
      const center = item.offsetTop + item.offsetHeight / 2;
      const distance = Math.abs(pointerY - center);
      const raw = Math.max(0, 1 - distance / 130);
      const effect = easeSmooth(raw);
      item.style.setProperty("--effect", effect.toFixed(4));
      item.classList.toggle("is-active", effect > 0.62 || (pointerY === null && index === 0));
    });
  }

  setEffects(null);

  sidebar.addEventListener("pointermove", (event) => {
    const rect = sidebar.getBoundingClientRect();
    setEffects(event.clientY - rect.top);
  });

  sidebar.addEventListener("pointerleave", () => {
    items.forEach((item, index) => {
      item.style.setProperty("--effect", index === 0 ? "1" : "0");
      item.classList.toggle("is-active", index === 0);
    });
  });
}

function initAnimatedList(panel) {
  if (!panel) {
    return;
  }

  const scrollArea = panel.querySelector("[data-animated-list-scroll]");
  const items = Array.from(panel.querySelectorAll("[data-animated-list-item]"));
  const topGradient = panel.querySelector(".faq-scroll-panel__gradient--top");
  const bottomGradient = panel.querySelector(".faq-scroll-panel__gradient--bottom");

  if (!scrollArea || items.length === 0) {
    return;
  }

  function updateGradients() {
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const topOpacity = Math.min(scrollTop / 48, 1);
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    const bottomOpacity =
      scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 48, 1);

    if (topGradient) {
      topGradient.style.opacity = topOpacity.toFixed(3);
    }

    if (bottomGradient) {
      bottomGradient.style.opacity = bottomOpacity.toFixed(3);
    }
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        root: scrollArea,
        threshold: 0.4,
      },
    );

    items.forEach((item) => observer.observe(item));
  } else {
    items.forEach((item) => item.classList.add("is-visible"));
  }

  scrollArea.addEventListener("scroll", updateGradients, { passive: true });
  updateGradients();
}

function wrapDigitsWithOswald(root = document.body) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !/\d/.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;
        if (!parent) {
          return NodeFilter.FILTER_REJECT;
        }

        if (
          parent.closest("script, style, noscript") ||
          parent.classList.contains("oswald-digit")
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    const parts = node.nodeValue.split(/(\d+(?:[.,]\d+)*)/);

    parts.forEach((part) => {
      if (!part) {
        return;
      }

      if (/^\d+(?:[.,]\d+)*$/.test(part)) {
        const span = document.createElement("span");
        span.className = "oswald-digit";
        span.textContent = part;
        fragment.appendChild(span);
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    });

    node.parentNode.replaceChild(fragment, node);
  });
}

wrapDigitsWithOswald();

document.querySelectorAll("[data-shape-grid]").forEach((canvas) => {
  initShapeGrid(canvas);
});

document.querySelectorAll("[data-magic-bento]").forEach((container) => {
  initMagicBento(container);
});

document.querySelectorAll("[data-magnet]").forEach((wrapper) => {
  initMagnet(wrapper);
});

document.querySelectorAll("[data-specular-button]").forEach((button) => {
  initSpecularButton(button);
});

document.querySelectorAll("[data-line-sidebar]").forEach((sidebar) => {
  initLineSidebar(sidebar);
});

document.querySelectorAll("[data-animated-list]").forEach((panel) => {
  initAnimatedList(panel);
});


document.querySelectorAll("[data-link]").forEach((element) => {
  const key = element.dataset.link;
  if (key && LINKS[key]) {
    element.href = LINKS[key];
  }
});

const videoModal = document.querySelector("[data-video-modal]");
const videoOpenButton = document.querySelector("[data-video-open]");
const videoPlayer = videoModal?.querySelector(".video-modal__player");

function closeVideoModal() {
  if (!videoModal) {
    return;
  }

  videoModal.classList.remove("is-open");
  videoModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-video-modal-open");

  if (videoPlayer) {
    videoPlayer.pause();
  }
}

if (videoModal && videoOpenButton && videoPlayer) {
  videoOpenButton.addEventListener("click", () => {
    videoModal.classList.add("is-open");
    videoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-video-modal-open");
    videoPlayer.play().catch(() => {});
  });

  videoModal.querySelectorAll("[data-video-close]").forEach((button) => {
    button.addEventListener("click", closeVideoModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && videoModal.classList.contains("is-open")) {
      closeVideoModal();
    }
  });
}

const revealNodes = document.querySelectorAll(".reveal-on-scroll:not(.is-visible)");

if ("IntersectionObserver" in window && revealNodes.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealNodes.forEach((node) => {
    revealObserver.observe(node);
  });
} else {
  revealNodes.forEach((node) => {
    node.classList.add("is-visible");
  });
}

const toggleButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const headerActions = document.querySelector(".header-actions");

if (toggleButton && nav && headerActions) {
  toggleButton.addEventListener("click", () => {
    const isOpen = toggleButton.getAttribute("aria-expanded") === "true";
    toggleButton.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open");
    headerActions.classList.toggle("is-open");
  });
}

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    if (!nav || !headerActions || !toggleButton) {
      return;
    }
    nav.classList.remove("is-open");
    headerActions.classList.remove("is-open");
    toggleButton.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll(".faq-item").forEach((item) => {
  const trigger = item.querySelector(".faq-item__trigger");
  if (!trigger) {
    return;
  }

  trigger.addEventListener("click", () => {
    const isOpen = item.classList.contains("is-open");
    document.querySelectorAll(".faq-item").forEach((node) => {
      node.classList.remove("is-open");
      const button = node.querySelector(".faq-item__trigger");
      if (button) {
        button.setAttribute("aria-expanded", "false");
      }
    });

    if (!isOpen) {
      item.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }
  });
});
