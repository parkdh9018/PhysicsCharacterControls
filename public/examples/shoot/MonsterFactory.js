import { Box3, PositionalAudio, Vector3 } from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { Monster } from './Monster.js';
import { HealthBar } from './HealthBar.js';

export class MonsterFactory {
  constructor(listener, objectGltf, runClip, dieClip, attackClip, hitClip, growlBuffer, attackBuffer) {
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

    return new Monster(
      clonedObject,
      clonedCollider,
      target,
      this.runClip,
      this.dieClip,
      this.attackClip,
      this.hitClip,
      audio,
      this.growlBuffer,
      this.attackBuffer,
      healthBar,
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
