import { KeyboardMixin } from '../mixins/KeyboardMixin';
import { PointerLockMixin } from '../mixins/PointerLockMixin';
import { ThirdPersonControls } from './core/ThirdPersonControls';

class TPKeyboardPointerLockControls extends KeyboardMixin( PointerLockMixin( ThirdPersonControls ) ) {}

export { TPKeyboardPointerLockControls };
