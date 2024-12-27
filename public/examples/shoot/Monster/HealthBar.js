import { CanvasTexture, Sprite, SpriteMaterial } from 'three';

export class HealthBar {
  constructor(width, height, maxHealth) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 100;
    this.canvas.height = 10;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new CanvasTexture(this.canvas);

    this.material = new SpriteMaterial({ map: this.texture });

    this.object = new Sprite(this.material);
    this.object.scale.set(width, height, 0);

    this.maxHealth = maxHealth;
    this.update(maxHealth);
  }

  update(health) {
    const percent = (health / this.maxHealth) * 100;

    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 100, 10);
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(0, 0, percent, 10);
    this.texture.needsUpdate = true;
  }

  despose() {
    this.texture.dispose();
    this.material.dispose();
  }
}
