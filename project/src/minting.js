import { drawLines } from "./shared";

export default function minting() {
  const infos = document.createElement("div");
  infos.innerHTML = "Drag the circle to define the position. <br/>Scroll on the circle to change its size.";
  const cvs = document.createElement("canvas");
  const details = document.createElement("div");
  document.body.appendChild(infos);
  document.body.appendChild(cvs);
  document.body.appendChild(details);
  const ctx = cvs.getContext("2d");
  cvs.width = cvs.height = 512;
  ctx.scale(512, 512);
  let mouseActive = false;
  function drawGrid() {
    ctx.lineWidth = 1;
    ctx.fillStyle = "blue";
    for (let x = 1 / 24; x <= 1; x += 1 / 24) {
      ctx.fillRect(x, 0, 1 / 1024, 1.0);
    }
    for (let y = 1 / 24; y <= 1; y += 1 / 24) {
      ctx.fillRect(0, y, 1.0, 1 / 1024);
    }
  }
  function drawPointer(x, y, size) {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, 1.0 - y, size, 0, 2 * Math.PI);
    ctx.fill();
  }
  function draw() {
    $fx.rand.reset();
    const X = $fx.getParam("turning");
    const Y = $fx.getParam("mutation");
    const size = $fx.getParam("population");
    ctx.clearRect(0, 0, 1, 1);
    drawGrid();
    drawPointer(X, Y, size * 1e-3);
    drawLines(ctx, X, 1 - Y, size);
    details.innerHTML = `
      <strong>coordinates:</strong> <span>[${X.toFixed(3)}; ${Y.toFixed(
      3
    )}]</span>
      <strong>size:</strong> <span>${size.toFixed(3)}</span>
    `;
  }
  draw();
  function refreshPosition(mouseX, mouseY) {
    const bounds = cvs.getBoundingClientRect();
    const x = clamp01((mouseX - bounds.x) / bounds.width);
    const y = 1.0 - clamp01((mouseY - bounds.y) / bounds.height);
    $fx.emit("params:update", {
      turning: x,
      mutation: y,
    });
  }
  cvs.addEventListener("mousedown", (evt) => {
    mouseActive = true;
    refreshPosition(evt.clientX, evt.clientY);
  });
  window.addEventListener("mouseup", () => {
    mouseActive = false;
  });
  window.addEventListener("mouseleave", () => {
    mouseActive = false;
  });
  window.addEventListener("mousemove", (evt) => {
    if (mouseActive) {
      refreshPosition(evt.clientX, evt.clientY);
    }
  });
  cvs.addEventListener("wheel", (evt) => {
    $fx.emit("params:update", {
      population: $fx.getParam("population") - evt.deltaY * 1e-2,
    });
  });
  $fx.on(
    "params:update",
    () => {},
    () => {
      draw();
    }
  );
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function clamp01(x) {
  return clamp(x, 0, 1);
}
