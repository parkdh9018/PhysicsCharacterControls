export class MonsterStore {
  constructor() {
    this.length = 0;
    this._monsters = [];
    this._objects = [];
  }
  add(monster) {
    this._monsters.push(monster);
    this._objects.push(monster.object);
    this.length = this._monsters.length;
  }
  delete(monster) {
    const monsterIndex = this._monsters.indexOf(monster);
    if (monsterIndex == -1) return;
    this._monsters.splice(monsterIndex, 1);
    this._objects.splice(monsterIndex, 1);
  }
  findMonsterByObject(object) {
    return this._monsters.find(monster => monster.object.getObjectById(object.id));
  }

  get monsters() {
    return this._monsters;
  }

  get objects() {
    return this._objects;
  }
}
