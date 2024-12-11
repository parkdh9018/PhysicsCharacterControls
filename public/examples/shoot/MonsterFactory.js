import { AudioLoader, Box3, PositionalAudio, Vector3 } from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { Monster } from './Monster.js';

export class MonsterFactory {
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
      this.collider = createCollider(this.object);
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
      this.worldOctree,
    );
  }
}

export function createCollider(object) {
  const objectSize = new Vector3();
  new Box3().setFromObject(object).getSize(objectSize);

  const radius = objectSize.y / 4;
  const height = objectSize.y;

  return new Capsule(new Vector3(0, radius, 0), new Vector3(0, height - radius, 0), radius);
}
