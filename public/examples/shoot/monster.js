import { AnimationMixer, AudioLoader, Box3, PositionalAudio, Vector3 } from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Capsule } from 'three/addons/math/Capsule.js';

class MonsterStore {
  static instances = [];

  static addInstance(monster) {
    this.instances.push(monster);
    this.index++;
  }

  static removeInstance(monster) {
    this.instances = this.instances.filter(mon => mon.id !== monster.id);
  }
}

class Monster {
  static index = 0;
  constructor(object, collider, target, runClip, dieClip, audio, growlBuffer, attackBuffer) {
    this.id = Monster.index++;

    this.health = 100;

    this.object = object;
    this.collider = collider;
    this.target = target;

    this.mixer = new AnimationMixer(this.object);
    this.runAction = this.mixer.clipAction(runClip);
    this.dieAction = this.mixer.clipAction(dieClip);
    this.dieAction.clampWhenFinished = true;

    this.audio = audio;
    this.growlBuffer = growlBuffer;
    this.attackBuffer = attackBuffer;

    this.audio.setBuffer(this.growlBuffer);
    this.audio.setRefDistance(5);
    this.audio.setLoop(true);
    this.audio.play();

    this._targetPosition = this.target.position.clone();

    this.runAction.play();

    this.vector1 = new Vector3();
    this.vector2 = new Vector3();

    MonsterStore.addInstance(this);
  }

  hit(damage) {
    this.health -= damage;

    if (this.health <= 0) {
      this.audio.stop();
      this.audio.setLoop(false);
      this.audio.setBuffer(this.attackBuffer);
      this.audio.play();
      this.dieAction.play();
      MonsterStore.removeInstance(this);
    }
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

  monsterCollisions() {
    MonsterStore.instances.forEach(target => {
      if (target.id === this.id) return;

      const d2 = this.collider.start.distanceToSquared(target.collider.start);
      const r = this.collider.radius + target.collider.radius;
      const r2 = r * r;

      if (d2 < r2) {
        const normal = this.vector1.subVectors(this.collider.start, target.collider.start).normalize();
        normal.y = 0;
        const d = (r - Math.sqrt(d2)) / 2;

        normal.multiplyScalar(d);
        this.collider.translate(this.vector2.copy(normal).multiplyScalar(d));
        target.collider.translate(this.vector2.copy(normal).multiplyScalar(-d));
      }
    });
  }

  update(delta) {
    this.mixer.update(delta);

    this._targetPosition.copy(this.target.position);
    this._targetPosition.y = 0;
    this.object.lookAt(this._targetPosition);

    const direction = this._targetPosition.sub(this.object.position).normalize();
    const distance = this.object.position.distanceTo(this.target.position);

    if (distance > 3) {
      this.collider.start.add(direction.multiplyScalar(delta));
    }
    this.monsterCollisions();
    this.object.position.copy(this.collider.start);
  }
}

class MonsterFactory {
  constructor(listener) {
    this.listener = listener;

    this.gltfLoader = new GLTFLoader();
    this.audioLoader = new AudioLoader();

    this.object = null;
    this.collider = null;

    this.runClip = null;
    this.dieClip = null;

    this.growlBuffer = null;
    this.attackBuffer = null;

    this.monsters = [];

    this.loadGLTF();
  }

  async loadGLTF() {
    Promise.all([
      this.gltfLoader.loadAsync('../../assets/models/monster.glb'),
      this.gltfLoader.loadAsync('../../assets/animations/monster_run.glb'),
      this.gltfLoader.loadAsync('../../assets/animations/monster_die.glb'),
    ]).then(([object, runClip, dieClip]) => {
      this.object = object.scene;
      this.runClip = runClip.animations[0];
      this.dieClip = dieClip.animations[0];

      const objectSize = new Vector3();
      new Box3().setFromObject(this.object).getSize(objectSize);

      const radius = objectSize.y / 4;
      const height = objectSize.y;

      this.collider = new Capsule(new Vector3(0, radius, 0), new Vector3(0, height - radius, 0), radius);
    });

    Promise.all([
      this.audioLoader.loadAsync('../../assets/audios/monster-growl.mp3'),
      this.audioLoader.loadAsync('../../assets/audios/monster-attack.mp3'),
    ]).then(([growlBuffer, attackBuffer]) => {
      this.growlBuffer = growlBuffer;
      this.attackBuffer = attackBuffer;
    });
  }

  createMonster(target) {
    if (!this.object || !this.runClip || !this.dieClip || !this.growlBuffer || !this.attackBuffer) {
      console.warn('GLTF data is not loaded. Call loadGLTF() first.');
      return null;
    }

    const clonedObject = SkeletonUtils.clone(this.object);
    clonedObject.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const clonedCollider = this.collider.clone();

    const audio = new PositionalAudio(this.listener);

    return new Monster(
      clonedObject,
      clonedCollider,
      target,
      this.runClip,
      this.dieClip,
      audio,
      this.growlBuffer,
      this.attackBuffer,
    );
  }
}

export { Monster, MonsterFactory, MonsterStore };
