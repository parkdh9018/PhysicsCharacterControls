import { Box3, PositionalAudio, Vector3 } from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { Monster } from './Monster.js';
import { HealthBar } from '../Common/HealthBar.js';
import { Octree } from 'three/addons/math/Octree.js';

export class MonsterFactory {
  constructor(worldObject, listener, objectGltf, runClip, dieClip, attackClip, hitClip, growlBuffer, attackBuffer) {
    this.woldOctree = new Octree().fromGraphNode(worldObject);
    this.listener = listener;

    this.object = objectGltf.scene;
    this.collider = createCollider(this.object);

    this.runClip = runClip.animations[0];
    this.dieClip = dieClip.animations[0];
    this.attackClip = attackClip.animations[0];
    this.hitClip = hitClip.animations[0];

    this.growlBuffer = growlBuffer;
    this.attackBuffer = attackBuffer;

    this.monsters = [];
  }

  createMonster(target) {
    const healthBar = new HealthBar(0.2, 0.02, 100);
    const audio = new PositionalAudio(this.listener);

    const clonedCollider = this.collider.clone();
    const clonedObject = SkeletonUtils.clone(this.object);
    clonedObject.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return new Monster({
      worldOctree: this.woldOctree,
      object: clonedObject,
      collider: clonedCollider,
      target: target,
      runClip: this.runClip,
      dieClip: this.dieClip,
      attackClip: this.attackClip,
      hitClip: this.hitClip,
      audio: audio,
      growlBuffer: this.growlBuffer,
      attackBuffer: this.attackBuffer,
      healthBar: healthBar,
    });
  }
}

export function createCollider(object) {
  const objectSize = new Vector3();
  new Box3().setFromObject(object).getSize(objectSize);

  const radius = objectSize.y / 4;
  const height = objectSize.y;

  return new Capsule(new Vector3(0, radius, 0), new Vector3(0, height - radius, 0), radius);
}
