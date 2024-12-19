import { AnimationMixer, EventDispatcher, LoopOnce, Vector3 } from 'three';

class Monster extends EventDispatcher {
  constructor({
    worldOctree,
    object,
    collider,
    target,
    runClip,
    dieClip,
    attackClip,
    hitClip,
    audio,
    growlBuffer,
    attackBuffer,
    healthBar,
  }) {
    super();
    this._worldOctree = worldOctree;
    this._isGrounded = false;
    this._fallSpeed = 0;
    this.step = 5;

    this.object = object;
    this.id = this.object.id;

    this.health = 100;
    this.healthBar = healthBar;
    healthBar.object.position.y = 2;
    this.object.add(healthBar.object);

    this.damage = 5;

    this.collider = collider;
    this.target = target;

    // animation
    this.mixer = new AnimationMixer(this.object);
    this.actions = {
      runAction: this.mixer.clipAction(runClip),
      dieAction: this.mixer.clipAction(dieClip),
      attackAction: this.mixer.clipAction(attackClip),
      hitAction: this.mixer.clipAction(hitClip),
    };
    this.actions.dieAction.clampWhenFinished = true;
    this.actions.dieAction.loop = LoopOnce;
    this.actions.attackAction.clampWhenFinished = true;
    this.actions.attackAction.loop = LoopOnce;

    this.actions.hitAction.clampWhenFinished = true;
    this.actions.hitAction.timeScale = 3;
    this.actions.hitAction.loop = LoopOnce;

    this.actions.runAction.play();
    this.mixer.addEventListener('finished', event => {
      if (event.action === this.actions.dieAction) {
        this.dispatchEvent({ type: 'die', monster: this });
        return;
      }
      this.actions.runAction.reset(); // 상태 초기화
      this.actions.runAction.crossFadeFrom(event.action, 0.5);
      this.actions.runAction.play(); // 다음 애니메이션 재생
    });

    // audio
    this.audio = audio;
    this.buffers = {
      growlBuffer: growlBuffer,
      attackBuffer: attackBuffer,
    };

    this.audio.setBuffer(this.growlBuffer);
    this.audio.setRefDistance(5);
    this.audio.setLoop(true);
    this.audio.play();

    this._targetPosition = this.target.position.clone();

    this.vector1 = new Vector3();
    this.vector2 = new Vector3();
  }

  attack() {
    if (!this.actions.attackAction.isRunning()) {
      this.audio.stop();
      this.audio.setLoop(false);
      this.audio.setBuffer(this.buffers.attackBuffer);
      this.audio.play();
      this.audio.onEnded = () => {
        this.audio.stop();
        this.audio.setLoop(true);
        this.audio.setBuffer(this.buffers.growlBuffer);
        this.audio.play();
      };

      this.actions.attackAction.reset();
      this.actions.attackAction.crossFadeFrom(this.actions.runAction, 0.5);
      this.actions.attackAction.play();
    }
  }

  hit(damage) {
    this.health -= damage;
    this.actions.hitAction.reset();
    this.actions.hitAction.play();
    this.healthBar.update(this.health);

    if (this.health <= 0) {
      this.actions.dieAction.play();
    }
  }

  _moveToTarget(delta) {
    this._targetPosition.copy(this.target.position);
    this._targetPosition.y = this.collider.start.y;
    this.object.lookAt(this._targetPosition);
    const direction = this._targetPosition.sub(this.object.position).normalize();

    this.collider.translate(direction.multiplyScalar(delta));
  }

  _collide(something) {
    const d2 = this.collider.start.distanceToSquared(something.collider.start);
    const r = this.collider.radius + something.collider.radius;
    const r2 = r * r;

    if (d2 < r2) {
      const normal = this.vector1.subVectors(this.collider.start, something.collider.start).normalize();
      normal.y = 0;
      const d = r - Math.sqrt(d2);

      normal.multiplyScalar(d);
      this.collider.translate(this.vector2.copy(normal).multiplyScalar(d));
    }
  }

  _collideMonsters(monsters) {
    monsters.forEach(monster => {
      if (monster.id !== this.id) this._collide(monster);
    });
  }

  _collideCharacter() {
    this._collide(this.target);
  }

  _fall(delta) {
    if (!this._isGrounded) {
      this._fallSpeed -= 9.8 * 0.001 * delta;
      this.collider.translate(this.vector1.set(0, this._fallSpeed, 0));
    }
  }

  _collideWorld() {
    this._isGrounded = false;
    const collisionResult = this._worldOctree.capsuleIntersect(this.collider);
    if (!collisionResult) return;

    if (collisionResult.normal.y > 0) {
      // Player is grounded.
      this._isGrounded = true;
      this._fallSpeed = 0;
    }

    if (collisionResult.depth >= 1e-10) {
      this.collider.translate(collisionResult.normal.multiplyScalar(collisionResult.depth));
    }
  }

  _playAnimation(delta) {
    this.mixer.update(delta);
  }

  _syncObjectToCollider() {
    this.object.position.copy(this.collider.start);
    this.object.position.y -= this.collider.radius;
  }

  update(delta, monsters) {
    const distance = this.object.position.distanceTo(this.target.position);
    if (distance < 2) this.attack();
    if (!this.actions.attackAction.isRunning() && !this.actions.hitAction.isRunning()) this._moveToTarget(delta * 3);
    for (let i = 0; i < this.step; i++) {
      this._fall(delta / this.step);
      this._collideWorld();

      this._collideMonsters(monsters);
      this._collideCharacter();
    }
    this._syncObjectToCollider();

    this._playAnimation(delta);
  }

  dispose() {}
}

export { Monster };
