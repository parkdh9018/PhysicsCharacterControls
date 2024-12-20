import { LoopOnce } from 'three';

const MONSTER_STATE_NAME = {
  RUN: 'RUN',
  ATTACK: 'ATTACK',
  HURT: 'HURT',
  DYING: 'DYING',
  DEAD: 'DEAD',
};

const MONSTER_EVENTS = {
  EMPTY_HEALTH: 'EMPTY_HEALTH',
  GET_SHOT: 'GET_SHOT',
  CLOSE_TO_TARGET: 'CLOSE_TO_TARGET',
  ON_END_STATE: 'ON_END_STATE',
};

class StateMachine {
  static DEAD_STATE = 'DEAD_STATE';
  constructor(defaultState, states, mixer, audio) {
    this.state = defaultState;
    this.states = states;
    this.mixer = mixer;
    this.audio = audio;

    this.state.enter(null, this.audio);
  }
  handleEvent(event) {
    const nextStateName = this.state.handleEvent(event);

    if (nextStateName !== null) {
      this.state.exit();
      const nextState = this.states?.[nextStateName];
      if (nextState) {
        nextState.enter(this.state, this.audio);
        this.state = nextState;
      }
    }
  }
}

class State {
  constructor(animationAction, audio, audioBuffer, onEndState = () => {}) {
    this.name = null;
    this.action = animationAction;
    this.action.clampWhenFinished = true;
    this.audio = audio;
    this.audioBuffer = audioBuffer;
    this.onEndState = onEndState;
    this.audioLoop = false;
    this.fadeInDuration = 0;
    this.fadeOutDuration = 0;
  }
  handleEvent(event) {
    console.log(event);
  }
  enter() {
    this.action.reset();
    this.action.fadeIn(this.fadeInDuration);
    this.action.play();

    this.audio.setLoop(this.audioLoop);
    this.audio.stop();
    this.audio.setBuffer(this.audioBuffer);
    this.audio.play();
  }
  exit() {
    this.onEndState();
    this.action.fadeOut(this.fadeOutDuration);
  }
}

class RunState extends State {
  constructor(animationAction, audio, audioBuffer) {
    super(animationAction, audio, audioBuffer);
    this.name = MONSTER_STATE_NAME.RUN;
    this.fadeInDuration = 0.2;
    this.fadeOutDuration = 1;
    this.audioLoop = true;
  }
  handleEvent(event) {
    switch (event) {
      case MONSTER_EVENTS.EMPTY_HEALTH:
        return MONSTER_STATE_NAME.DYING;
      case MONSTER_EVENTS.GET_SHOT:
        return MONSTER_STATE_NAME.HURT;
      case MONSTER_EVENTS.CLOSE_TO_TARGET:
        return MONSTER_STATE_NAME.ATTACK;
      default:
        return null;
    }
  }
}

class HurtState extends State {
  constructor(animationAction, audio, audioBuffer) {
    super(animationAction, audio, audioBuffer);
    this.name = MONSTER_STATE_NAME.HURT;
    this.action.loop = LoopOnce;
    this.action.timeScale = 3;

    this.fadeInDuration = 0.2;
    this.fadeOutDuration = 1;
    this.audioLoop = false;
  }
  handleEvent(event) {
    switch (event) {
      case MONSTER_EVENTS.EMPTY_HEALTH:
        return MONSTER_STATE_NAME.DYING;
      case MONSTER_EVENTS.ON_END_STATE:
        return MONSTER_STATE_NAME.RUN;
      case MONSTER_EVENTS.GET_SHOT:
        return MONSTER_STATE_NAME.HURT;
      default:
        return null;
    }
  }
}

class AttackState extends State {
  constructor(animationAction, audio, audioBuffer) {
    super(animationAction, audio, audioBuffer);
    this.name = MONSTER_STATE_NAME.ATTACK;
    this.action.loop = LoopOnce;

    this.fadeInDuration = 0.2;
    this.fadeOutDuration = 1;
    this.audioLoop = false;
  }
  handleEvent(event) {
    switch (event) {
      case MONSTER_EVENTS.EMPTY_HEALTH:
        return MONSTER_STATE_NAME.DYING;
      case MONSTER_EVENTS.GET_SHOT:
        return MONSTER_STATE_NAME.HURT;
      case MONSTER_EVENTS.ON_END_STATE:
        return MONSTER_STATE_NAME.RUN;
      default:
        return null;
    }
  }
}

class DyingState extends State {
  constructor(animationAction, audio, audioBuffer, onEndState) {
    super(animationAction, audio, audioBuffer, onEndState);
    this.name = MONSTER_STATE_NAME.DYING;
    this.action.loop = LoopOnce;

    this.fadeInDuration = 1;
    this.fadeOutDuration = 30;
    this.audioLoop = false;
  }
  handleEvent(event) {
    switch (event) {
      case MONSTER_EVENTS.ON_END_STATE:
        return MONSTER_STATE_NAME.DEAD;
      default:
        return null;
    }
  }
}

export { MONSTER_STATE_NAME, MONSTER_EVENTS, StateMachine, RunState, AttackState, DyingState, HurtState };
