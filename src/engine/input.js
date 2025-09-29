const KEY_MAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
  Space: "fire",
  Enter: "pause",
  KeyP: "pause",
};

export class Input {
  constructor() {
    this.active = new Set();
    this.pressed = new Set();
    this.listenersBound = false;
    this.keydownHandler = this.handleKeyDown.bind(this);
    this.keyupHandler = this.handleKeyUp.bind(this);
  }

  bind() {
    if (this.listenersBound) {
      return;
    }
    window.addEventListener("keydown", this.keydownHandler);
    window.addEventListener("keyup", this.keyupHandler);
    this.listenersBound = true;
  }

  unbind() {
    if (!this.listenersBound) {
      return;
    }
    window.removeEventListener("keydown", this.keydownHandler);
    window.removeEventListener("keyup", this.keyupHandler);
    this.listenersBound = false;
    this.active.clear();
    this.pressed.clear();
  }

  handleKeyDown(event) {
    const action = KEY_MAP[event.code];
    if (!action) {
      return;
    }
    event.preventDefault();
    if (!this.active.has(action)) {
      this.pressed.add(action);
    }
    this.active.add(action);
  }

  handleKeyUp(event) {
    const action = KEY_MAP[event.code];
    if (!action) {
      return;
    }
    event.preventDefault();
    this.active.delete(action);
  }

  isActive(action) {
    return this.active.has(action);
  }

  consume(action) {
    if (this.pressed.has(action)) {
      this.pressed.delete(action);
      return true;
    }
    return false;
  }

  clearFrameState() {
    this.pressed.clear();
  }
}
