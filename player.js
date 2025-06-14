// player.js
import {
	ROCK_BOB_AMOUNT,
	ROCK_BOB_DURATION,
	PAPER_ROTATE_AMOUNT,
	PAPER_ROTATE_DURATION,
	SCISSORS_SCALE_AMOUNT,
	SCISSORS_SCALE_DURATION,
	ENEMY_TYPES, // Needed for randomization
} from './constants.js';

export class Player {
	constructor(scene, x, y, initialTextureKey) {
		// Correctly assign the sprite object to this.playerSprite
		this.playerSprite = scene.physics.add
			.sprite(x, y, initialTextureKey)
			.setScale(40 / 120) // Initial scale
			.setOrigin(0.5, 1) // Origin at the bottom center
			.setCollideWorldBounds(true); // Keep player within game bounds

		// Now, set physics properties on the sprite's body
		this.playerSprite.body.setAllowGravity(false); // Player is not affected by gravity

		this.scene = scene; // Keep scene reference for tweens
		this.type = null; // Current RPS type of the player
		this.gameObjectBaseY = y - 10; // Store base Y for animation reset
	}

	// Sets the player's texture and applies the corresponding animation
	setType(type) {
		this.type = type;
		this.playerSprite.setTexture(this.getAssetKeyFromType(type));
		this.applyAnimation();
	}

	// Randomizes the player's type and updates its appearance and animation
	randomizeType() {
		// Corrected: Use global Phaser.Math directly
		this.setType(Phaser.Math.RND.pick(ENEMY_TYPES));
	}

	// Returns the asset key (image name) based on the RPS type
	getAssetKeyFromType(type) {
		switch (type) {
			case 'R':
				return 'rock';
			case 'P':
				return 'paper';
			case 'S':
				return 'scissors';
			default:
				return 'paper'; // Default to paper if type is unknown
		}
	}

	// Applies the specific animation based on the player's current type
	applyAnimation() {
		// Stop any currently running tweens on the player to prevent multiple animations
		this.scene.tweens.killTweensOf(this.playerSprite);

		// Reset player's properties to their default state before applying new animation
		this.playerSprite.rotation = 0; // Reset rotation
		this.playerSprite.setScale(40 / 120); // Reset to base scale
		this.playerSprite.y = this.gameObjectBaseY + 10; // Reset Y position if it was affected by bob

		// Apply animation based on current player type
		switch (this.type) {
			case 'R': // Rock: Bob up/down
				this.scene.tweens.add({
					targets: this.playerSprite,
					y: this.playerSprite.y - ROCK_BOB_AMOUNT, // Move player sprite up
					duration: ROCK_BOB_DURATION,
					ease: 'Sine.easeInOut',
					yoyo: true,
					repeat: -1,
				});
				break;
			case 'P': // Paper: Rotate back and forth
				this.scene.tweens.add({
					targets: this.playerSprite,
					rotation: { from: 0, to: PAPER_ROTATE_AMOUNT },
					duration: PAPER_ROTATE_DURATION,
					ease: 'Sine.easeInOut',
					yoyo: true,
					repeat: -1,
				});
				break;
			case 'S': // Scissors: Scale up/down
				const initialScale = 40 / 120;
				this.scene.tweens.add({
					targets: this.playerSprite,
					scaleX: initialScale + SCISSORS_SCALE_AMOUNT,
					scaleY: initialScale + SCISSORS_SCALE_AMOUNT,
					duration: SCISSORS_SCALE_DURATION,
					ease: 'Sine.easeInOut',
					yoyo: true,
					repeat: -1,
				});
				break;
			default:
				// No animation for unknown type, ensure properties are reset
				break;
		}
	}

	// Getter for the actual Phaser sprite object
	get sprite() {
		return this.playerSprite;
	}
}
