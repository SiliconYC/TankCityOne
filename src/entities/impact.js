// path: src/entities/impact.js
export function spawnImpactEffect(root, { x, y, size = 32, variant = "spark" } = {}) {
  if (!root) {
    return;
  }
  const safeVariant = variant ? String(variant) : "spark";
  const node = document.createElement("span");
  node.className = `impact impact--${safeVariant}`;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.setProperty("--impact-size", `${Math.max(size, 12)}px`);
  root.appendChild(node);

  const remove = () => {
    node.remove();
  };
  node.addEventListener("animationend", remove, { once: true });
  node.addEventListener("animationcancel", remove, { once: true });
}
