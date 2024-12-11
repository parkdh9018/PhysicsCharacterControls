import { AnimationMixer, Vector3 } from 'three';

class Monster {
  static index = 0;
  constructor(object, collider, target, runClip, dieClip, audio, growlBuffer, attackBuffer) {
    this.id = Monster.index++;

    this.health = 100;
    this.damage = 5;

    this.object = object;
    this.collider = collider;
    this.target = target;

    // animation
    this.mixer = new AnimationMixer(this.object);
    this.actions = {
      runAction: this.mixer.clipAction(runClip),
      dieAction: this.mixer.clipAction(dieClip),
    };
    this.actions.dieAction.clampWhenFinished = true;

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

    this.actions.runAction.play();

    this.vector1 = new Vector3();
    this.vector2 = new Vector3();
  }
  attack() {}

  hit(damage) {
    this.health -= damage;

    if (this.health <= 0) {
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
      this.actions.dieAction.play();
    }
  }

  _moveToTarget(delta) {
    this._targetPosition.copy(this.target.position);
    this._targetPosition.y = 0;
    this.object.lookAt(this._targetPosition);
    const direction = this._targetPosition.sub(this.object.position).normalize();
    const distance = this.object.position.distanceTo(this.target.position);

    if (distance > 3) {
      this.collider.start.add(direction.multiplyScalar(delta));
    }
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

  _playAnimation(delta) {
    this.mixer.update(delta);
  }

  _syncObjectToCollider() {
    this.object.position.copy(this.collider.start);
  }

  update(delta, monsters) {
    this._moveToTarget(delta);
    this._collideMonsters(monsters);
    this._syncObjectToCollider();
    this._playAnimation(delta);
  }

  // playAnimation(clipName) {
  //   const clip = this.clips.find(clip => clip.name === clipName);
  //   if (clip) {
  //     if (this.currentAction) {
  //       this.currentAction.stop();
  //     }
  //     this.currentAction = this.mixer.clipAction(clip);
  //     this.currentAction.play();
  //   } else {
  //     console.warn(`Clip "${clipName}" not found.`);
  //   }
  // }

  // monsterCollisions() {
  //   MonsterStore.instances.forEach(target => {
  //     if (target.id === this.id) return;

  //     const d2 = this.collider.start.distanceToSquared(target.collider.start);
  //     const r = this.collider.radius + target.collider.radius;
  //     const r2 = r * r;

  //     if (d2 < r2) {
  //       const normal = this.vector1.subVectors(this.collider.start, target.collider.start).normalize();
  //       normal.y = 0;
  //       const d = (r - Math.sqrt(d2)) / 2;

  //       normal.multiplyScalar(d);
  //       this.collider.translate(this.vector2.copy(normal).multiplyScalar(d));
  //       target.collider.translate(this.vector2.copy(normal).multiplyScalar(-d));
  //     }
  //   });
  // }
}

export { Monster };
