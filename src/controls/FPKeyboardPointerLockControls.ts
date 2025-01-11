import { KeyboardMixin } from '../mixins/KeyboardMixin';
import { PointerLockMixin } from '../mixins/PointerLockMixin';
import { FirstPersonControls } from './core/FirstPersonControls';

class FPKeyboardPointerLockControls extends KeyboardMixin( PointerLockMixin( FirstPersonControls ) ) {}

export { FPKeyboardPointerLockControls };
