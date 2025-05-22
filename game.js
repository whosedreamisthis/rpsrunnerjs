// game.js

// --- Constants (from consts.py, and new ones) ---
const WINDOW_WIDTH = 700;
const WINDOW_HEIGHT = 350; // Increased height to accommodate taller buttons and spacing
const GROUND_HEIGHT = 110; // This is relative to the bottom of the screen, so it will be WINDOW_HEIGHT - GROUND_HEIGHT_OFFSET in Phaser
// Removed GROUND_Y_OFFSET and PLAYER_Y_OFFSET as they will be re-calculated based on new positioning
const GAME_OBJECTS_BASE_Y_RATIO = 0.75; // Player and Enemy base at 75% of window height from top
const GROUND_OFFSET_FROM_GAME_OBJECTS = 0; // Changed to 0 to align player/enemy with ground top

const ENEMY_TYPES = ['R', 'P', 'S'];
const SPEED_UPGRADE_FRAME = 1200; // In score
const GOD_MODE = false; // Corresponds to god_mode in Python

// Colors (Phaser uses hexadecimal for colors, defined as integers here)
const WHITE = 0xffffff;
const BLACK = 0x000000;
const GREEN = 0x00c800; // (0,200,0)
const DARK_GRAY = 0x313638; // (49,54,56)
const OFFWHITE = 0xf0f0f0; // New color for background
const ROCK_COLOR = 0x59c3c3; // (89,195,195)
const PAPER_COLOR = 0x774c60; // (119,76,96)
const SCISSORS_COLOR = 0x84a98c; // (132,169,140)

// New constants for ground appearance
const VISIBLE_GROUND_LINE_HEIGHT = 25; // Estimated height of the visible ground line in ground.png
const GROUND_FILL_COLOR = 0x313638; // Using DARK_GRAY for the fill below the line

// Vertical adjustment for ground and hands
const VERTICAL_MOVE_UP_AMOUNT = 25;

// Original spawn times in SECONDS
const ORIGINAL_MIN_SPAWN_DURATION = 2.0; // seconds
const ORIGINAL_MAX_SPAWN_DURATION = 4.0; // seconds

// UI Button Constants
const BUTTON_HORIZONTAL_PADDING = 20; // Margin from left/right edges of the screen
const BUTTON_SPACING = 10; // Space between each RPS button
const BUTTON_PADDING_X = 20; // Horizontal padding within buttons
const BUTTON_PADDING_Y = 15; // Vertical padding within buttons
// BUTTON_BOTTOM_MARGIN is no longer a fixed constant here, its value is derived
const PAUSE_BUTTON_RIGHT_MARGIN = 20; // Margin from right edge of the screen for pause button

// Button Text Content - Renamed back to R, P, S
const BUTTON_TEXT = {
	R: 'R',
	P: 'P',
	S: 'S',
};

// Asset URLs - This constant MUST be defined before preload() tries to use it.
const ASSET_URLS = {
	rock: 'https://raw.githubusercontent.com/whosedreamisthis/rpsrunner/main/assets/images/rock.png',
	scissors:
		'https://raw.githubusercontent.com/whosedreamisthis/rpsrunner/main/assets/images/scissors.png',
	paper: 'https://raw.githubusercontent.com/whosedreamisthis/rpsrunner/main/assets/images/paper.png',
	ground: 'https://raw.githubusercontent.com/whosedreamisthis/rpsrunner/main/assets/images/ground.png',
	coinSound:
		'https://raw.githubusercontent.com/whosedreamisthis/rpsrunner/main/assets/sounds/coin.wav',
	injurySound:
		'https://raw.githubusercontent.com/whosedreamisthis/rpsrunner/main/assets/sounds/injury.wav',
	jumpSound:
		'https://raw.githubusercontent.com/whosedreamisthis/rpsrunner/main/assets/sounds/jump.wav',
};

// --- Game Scene ---
class MainScene extends Phaser.Scene {
	constructor() {
		super({ key: 'MainScene' });
		this.gameStarted = false;
		this.game_over = false;
		this.current_score = 0;
		this.high_score = 0;
		this.playerType = null;
		this.player = null;
		this.ground = null;
		this.enemies = null; // Phaser group for enemies
		this.ground_speed = 2; // Initial ground speed
		this.current_frame = 0; // For speed upgrade tracking

		// Enemy spawn management
		this.time_since_last_spawn = 0; // ms
		this.time_until_next_spawn = 0; // ms
		this.base_min_spawn_duration = ORIGINAL_MIN_SPAWN_DURATION * 1000; // ms
		this.base_max_spawn_duration = ORIGINAL_MAX_SPAWN_DURATION * 1000; // ms
		this.min_wait_time = this.base_min_spawn_duration;
		this.max_wait_time = this.base_max_spawn_duration;

		// UI Elements
		this.scoreText = null;
		this.gameOverText = null;
		this.restartButton = null;
		this.rockButton = null;
		this.paperButton = null;
		this.scissorsButton = null;
		this.startButton = null;

		// Pause Button
		this.pauseButton = null;
		this.isPaused = false; // State to track if the game is paused
		this.pausedText = null; // Text overlay for "PAUSED"

		this.original_ground_speed = this.ground_speed; // For spawn rate adjustment

		// Calculated Y position for player/enemy base (their feet)
		this.gameObjectBaseY =
			WINDOW_HEIGHT * GAME_OBJECTS_BASE_Y_RATIO - VERTICAL_MOVE_UP_AMOUNT;
	}

	preload() {
		// ASSET_URLS is used here
		this.load.image('rock', ASSET_URLS.rock);
		this.load.image('scissors', ASSET_URLS.scissors);
		this.load.image('paper', ASSET_URLS.paper);
		this.load.image('ground', ASSET_URLS.ground);

		this.load.audio('coin', ASSET_URLS.coinSound);
		this.load.audio('injury', ASSET_URLS.injurySound);
		this.load.audio('jump', ASSET_URLS.jumpSound);
	}

	create() {
		// --- Game Initialization ---
		this.physics.world.setBounds(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
		// Changed background color to OFFWHITE
		this.cameras.main.setBackgroundColor(OFFWHITE);

		// Ground setup (using two tile sprites for infinite scrolling of the ground line)
		const groundY = this.gameObjectBaseY + GROUND_OFFSET_FROM_GAME_OBJECTS; // This is the top of the visible ground line

		this.ground1 = this.add
			.tileSprite(
				0,
				groundY,
				WINDOW_WIDTH,
				VISIBLE_GROUND_LINE_HEIGHT,
				'ground'
			)
			.setOrigin(0, 0);
		this.ground2 = this.add
			.tileSprite(
				WINDOW_WIDTH,
				groundY,
				WINDOW_WIDTH,
				VISIBLE_GROUND_LINE_HEIGHT,
				'ground'
			)
			.setOrigin(0, 0);

		// Add rectangles to fill the space below the ground line
		const groundFillY = groundY + VISIBLE_GROUND_LINE_HEIGHT;
		const groundFillHeight = WINDOW_HEIGHT - groundFillY;

		this.groundFill1 = this.add
			.rectangle(
				0,
				groundFillY,
				WINDOW_WIDTH,
				groundFillHeight,
				GROUND_FILL_COLOR
			)
			.setOrigin(0, 0);
		this.groundFill2 = this.add
			.rectangle(
				WINDOW_WIDTH,
				groundFillY,
				WINDOW_WIDTH,
				groundFillHeight,
				GROUND_FILL_COLOR
			)
			.setOrigin(0, 0);

		// Enemies Group (for collision detection)
		this.enemies = this.physics.add.group();

		// Player setup - positioned based on new GAME_OBJECTS_BASE_Y_RATIO
		this.player = this.physics.add
			.sprite(35, this.gameObjectBaseY + 10, 'paper') // Added 10 pixels
			.setScale(40 / 120) // Original scale factor
			.setOrigin(0.5, 1); // Origin at the bottom center
		this.player.setCollideWorldBounds(true);
		this.player.body.setAllowGravity(false); // Player doesn't fall down

		this.randomizePlayerType();

		// Score display - Aligned with the left side of the player sprite
		this.high_score = this.loadHighScore();
		this.scoreText = this.add
			.text(
				15,
				20,
				`score: ${this.current_score
					.toString()
					.padStart(4, '0')}  high: ${this.high_score
					.toString()
					.padStart(4, '0')}`,
				{
					fontFamily: 'Courier Prime, Courier, monospace', // Changed to Courier font
					fontSize: '20px', // Original font size
					fill: '#' + DARK_GRAY.toString(16).padStart(6, '0'), // Corrected color assignment for text
					align: 'left', // Explicitly left aligned
				}
			)
			.setOrigin(0, 0.5); // Set origin to top-left for X, centered vertically for Y

		// Pause Button
		this.pauseButton = this.add
			.text(WINDOW_WIDTH - PAUSE_BUTTON_RIGHT_MARGIN, 20, '||', {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '20px', // Matches score font size
				fill: '#' + DARK_GRAY.toString(16).padStart(6, '0'),
				backgroundColor: '#' + OFFWHITE.toString(16).padStart(6, '0'),
				// Removed padding for a tighter fit, matching score text's visual size
			})
			.setOrigin(1, 0.5) // Align right edge with its x, vertically centered
			.setInteractive()
			.on('pointerdown', this.togglePause, this)
			.setVisible(false); // Hide initially

		// "PAUSED" text overlay - Moved 25 pixels higher
		this.pausedText = this.add
			.text(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2 - 70, 'PAUSED', {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '50px',
				fill: '#' + DARK_GRAY.toString(16).padStart(6, '0'),
			})
			.setOrigin(0.5)
			.setVisible(false);

		// Game Over Text - Moved to overlap PAUSED text
		this.gameOverText = this.add
			.text(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2 - 70, 'GAME OVER!', {
				fontFamily: 'Courier Prime, Courier, monospace', // Changed to Courier font
				fontSize: '50px',
				fill: '#' + ROCK_COLOR.toString(16).padStart(6, '0'), // Corrected color assignment for text
			})
			.setOrigin(0.5)
			.setVisible(false);

		// --- RPS Buttons Setup (Expanded to screen width and taller) ---
		const totalButtonAreaWidth =
			WINDOW_WIDTH - 2 * BUTTON_HORIZONTAL_PADDING;
		const singleButtonCalculatedWidth =
			(totalButtonAreaWidth - 2 * BUTTON_SPACING) / 3;

		// Calculate button height based on font size and padding
		const buttonTextHeight = 32; // This matches the font size set in createRPSButton
		const singleButtonHeight = buttonTextHeight + 2 * BUTTON_PADDING_Y; // Total height of the button graphic

		// Calculate the visual bottom edge of the ground image
		const visualGroundBottomY =
			WINDOW_HEIGHT * GAME_OBJECTS_BASE_Y_RATIO -
			VERTICAL_MOVE_UP_AMOUNT +
			VISIBLE_GROUND_LINE_HEIGHT;

		// Calculate button Y position to center them between the bottom of the ground and the bottom of the window
		const buttonY = (visualGroundBottomY + WINDOW_HEIGHT) / 2;

		const rockX =
			BUTTON_HORIZONTAL_PADDING + singleButtonCalculatedWidth / 2;
		const paperX = rockX + singleButtonCalculatedWidth + BUTTON_SPACING;
		const scissorsX = paperX + singleButtonCalculatedWidth + BUTTON_SPACING;

		// Pass full text and calculated width to createRPSButton
		// Button background is now OFFWHITE, and text color uses the specific RPS color
		this.rockButton = this.createRPSButton(
			rockX,
			buttonY,
			'R',
			BUTTON_TEXT.R,
			'rock',
			ROCK_COLOR,
			singleButtonCalculatedWidth
		);
		this.paperButton = this.createRPSButton(
			paperX,
			buttonY,
			'P',
			BUTTON_TEXT.P,
			'paper',
			PAPER_COLOR,
			singleButtonCalculatedWidth
		);
		this.scissorsButton = this.createRPSButton(
			scissorsX,
			buttonY,
			'S',
			BUTTON_TEXT.S,
			'scissors',
			SCISSORS_COLOR,
			singleButtonCalculatedWidth
		);
		this.setRPSButtonsVisibility(false); // Hide initially

		// Start Button - Adjusted to overlap the P button and match its style
		this.startButton = this.add
			.text(paperX, buttonY, 'START GAME', {
				// X-position changed to paperX
				fontFamily: 'Courier Prime', // Matched RPS button font
				fontSize: '32px', // Matched RPS button font size
				fill: '#' + PAPER_COLOR.toString(16).padStart(6, '0'), // Changed fill to PAPER_COLOR
				backgroundColor: '#' + OFFWHITE.toString(16).padStart(6, '0'), // Changed background to OFFWHITE
				padding: { x: 10, y: BUTTON_PADDING_Y }, // Adjusted x padding for centering
				fixedWidth: singleButtonCalculatedWidth, // Matched RPS button width
				align: 'center', // Center text within the fixed width
			})
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => this.startGame());

		// Restart Button - Moved to overlap the P button, same style as Start Game button
		this.restartButton = this.add
			.text(paperX, buttonY, 'Restart', {
				// X-position changed to paperX
				fontFamily: 'Courier Prime', // Matched Start Game button font
				fontSize: '32px', // Matched Start Game button font size
				fill: '#' + PAPER_COLOR.toString(16).padStart(6, '0'), // Matched Start Game button fill color
				backgroundColor: '#' + OFFWHITE.toString(16).padStart(6, '0'), // Matched Start Game button background color
				padding: { x: 10, y: BUTTON_PADDING_Y }, // Matched Start Game button padding
				fixedWidth: singleButtonCalculatedWidth, // Matched Start Game button width
				align: 'center', // Matched Start Game button align
			})
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => this.startGame())
			.setVisible(false); // Hide initially

		// Set initial spawn time
		this.time_until_next_spawn = Phaser.Math.Between(
			this.min_wait_time,
			this.max_wait_time
		);

		// --- Collision Handler ---
		this.physics.add.overlap(
			this.player,
			this.enemies,
			this.handleCollision,
			null,
			this
		);
	}

	update(time, delta) {
		// Game logic only runs if gameStarted, not game_over, AND not paused
		if (!this.gameStarted || this.game_over || this.isPaused) {
			return;
		}

		// --- Ground Scrolling ---
		this.ground1.x -= this.ground_speed;
		this.ground2.x -= this.ground_speed;
		this.groundFill1.x -= this.ground_speed; // Also scroll the ground fill
		this.groundFill2.x -= this.ground_speed; // Also scroll the ground fill

		if (this.ground1.x + this.ground1.width < 0) {
			this.ground1.x = this.ground2.x + this.ground2.width;
			this.groundFill1.x = this.groundFill2.x + this.groundFill2.width; // Also reset ground fill
		}
		if (this.ground2.x + this.ground2.width < 0) {
			this.ground2.x = this.ground1.x + this.ground1.width;
			this.groundFill2.x = this.groundFill1.x + this.groundFill1.width; // Also reset ground fill
		}

		// --- Enemy Spawning ---
		this.time_since_last_spawn += delta;
		if (this.time_since_last_spawn >= this.time_until_next_spawn) {
			this.spawnEnemy();
			this.time_since_last_spawn = 0;
			this.time_until_next_spawn = Phaser.Math.Between(
				this.min_wait_time,
				this.max_wait_time
			);
		}

		// --- Update Enemies ---
		this.enemies.children.each((enemy) => {
			enemy.x -= this.ground_speed;
			if (enemy.x < -enemy.width / 2) {
				enemy.destroy(); // Remove enemy when off screen
				// No direct penalty for missing, just won't score
			}
		});

		// --- Speed Upgrade ---
		// Use current_score for speed checks as a direct translation
		if (
			this.current_score > 0 &&
			this.current_score % SPEED_UPGRADE_FRAME === 0 &&
			this.current_frame != this.current_score
		) {
			// Check to prevent repeated upgrade on same score
			this.ground_speed += 1;
			this.current_frame = this.current_score; // Set frame to current score to track last upgrade
			this.adjustSpawnRate(this.ground_speed);
		}
	}

	startGame() {
		this.gameStarted = true;
		this.game_over = false;
		this.isPaused = false; // Ensure game starts unpaused
		this.current_score = 0;
		this.ground_speed = 2; // Reset speed
		this.time_since_last_spawn = 0;
		this.enemies.clear(true, true); // Clear all existing enemies
		this.spawnEnemy(); // Spawn the first enemy immediately
		this.setRPSButtonsVisibility(true);
		this.gameOverText.setVisible(false);
		this.restartButton.setVisible(false);
		this.startButton.setVisible(false); // Make sure start button is hidden after game starts
		this.pauseButton.setVisible(true); // Show pause button
		this.pauseButton.setText('||'); // Ensure pause icon
		if (this.pausedText) {
			this.pausedText.setVisible(false); // Hide "PAUSED" text
		}
		this.randomizePlayerType();
		this.updateScoreDisplay();
		this.adjustSpawnRate(this.ground_speed); // Reset spawn rate as well
		this.current_frame = 0; // Reset speed upgrade tracker

		// Ensure physics are resumed if starting from a paused/game over state
		this.physics.world.resume();
	}

	togglePause() {
		this.isPaused = !this.isPaused;

		if (this.isPaused) {
			// Scene's update loop is controlled by the 'if (this.isPaused)' check in update()
			this.physics.world.pause(); // Pauses all physics bodies
			this.pauseButton.setText('\u25B6'); // Change icon to UNICODE play symbol
			this.pausedText.setVisible(true); // Show "PAUSED" text
		} else {
			// Scene's update loop will resume because 'this.isPaused' is now false
			this.physics.world.resume(); // Resumes all physics bodies
			this.pausedText.setVisible(false); // Hide "PAUSED" text
		}
	}

	randomizePlayerType() {
		this.playerType = Phaser.Math.RND.pick(ENEMY_TYPES);
		this.player.setTexture(this.getAssetKeyFromType(this.playerType));
	}

	// Corrected createRPSButton signature for clarity
	createRPSButton(
		x,
		y,
		buttonType,
		buttonText,
		assetKey,
		buttonColor,
		buttonWidth
	) {
		// Renamed 'color' to 'buttonColor'
		// Convert integer hex color to CSS hex string
		const bgColor = '#' + OFFWHITE.toString(16).padStart(6, '0'); // Background is OFFWHITE
		const textColor = '#' + buttonColor.toString(16).padStart(6, '0'); // Text color is the distinct RPS color

		const button = this.add
			.text(x, y, buttonText, {
				fontFamily: 'Courier Prime, Courier, monospace', // Changed to Courier font
				fontSize: '32px', // Increased font size here
				fill: textColor,
				backgroundColor: bgColor,
				padding: { x: BUTTON_PADDING_X, y: BUTTON_PADDING_Y }, // Use new padding constants
				fixedWidth: buttonWidth,
				align: 'center', // Center text within the fixed width
			})
			.setOrigin(0.5) // Origin for positioning
			.setInteractive()
			.on('pointerdown', () => {
				if (!this.game_over && !this.isPaused) {
					// Only allow type change if not game over and not paused
					this.playerType = buttonType; // Use the actual type (R,P,S) for game logic
					this.player.setTexture(assetKey); // Set player texture
				}
			});
		return button;
	}

	setRPSButtonsVisibility(visible) {
		this.rockButton.setVisible(visible);
		this.paperButton.setVisible(visible);
		this.scissorsButton.setVisible(visible);
	}

	spawnEnemy() {
		const enemyType = Phaser.Math.RND.pick(ENEMY_TYPES);
		const enemyAssetKey = this.getAssetKeyFromType(enemyType);
		// Enemy Y position - positioned based on new GAME_OBJECTS_BASE_Y_RATIO
		const enemy = this.enemies
			.create(WINDOW_WIDTH + 50, this.gameObjectBaseY + 10, enemyAssetKey) // Added 10 pixels
			.setScale(40 / 120) // Scale to match player
			.setOrigin(0.5, 1); // Origin at the bottom center
		enemy.type = enemyType; // Attach type to the sprite for duel logic
		enemy.body.setAllowGravity(false);
		enemy.body.setSize(enemy.width * 0.8, enemy.height * 0.8); // Adjust hit box for better collision
		enemy.body.setOffset(enemy.width * 0.1, enemy.height * 0.2);
	}

	getAssetKeyFromType(type) {
		switch (type) {
			case 'R':
				return 'rock';
			case 'P':
				return 'paper';
			case 'S':
				return 'scissors';
			default:
				return 'paper'; // Fallback
		}
	}

	handleCollision(playerSprite, enemySprite) {
		// The enemy is removed when it collides with the player, regardless of win/loss
		// in Python, this is done by `enemies_manager.pop_first_enemy()`
		// The check `enemy.get_x_pos() <= 50` in `collide` suggests it acts when enemy is close.
		// Phaser's overlap is more immediate. Let's make sure an enemy only triggers once.

		if (
			enemySprite.active &&
			enemySprite.x <= playerSprite.x + playerSprite.width / 2 &&
			enemySprite.duelHandled !== true
		) {
			enemySprite.duelHandled = true; // Mark as handled to prevent multiple triggers

			const winner = GOD_MODE
				? 'Player'
				: this.duel(this.playerType, enemySprite.type);

			if (winner === 'Enemy') {
				this.sound.play('injury');
				this.game_over = true;
				this.gameOverText.setVisible(true);
				this.restartButton.setVisible(true);
				this.setRPSButtonsVisibility(false);
				this.pauseButton.setVisible(false); // Hide pause button on game over
				this.pausedText.setVisible(false); // Hide "PAUSED" text if game over
				this.saveHighScore(this.current_score);
			} else {
				if (winner === 'Player') {
					this.current_score += 1;
					this.sound.play('coin');
				} else if (winner === 'Tie') {
					this.sound.play('jump');
				}
				enemySprite.destroy(); // Remove the enemy after duel
				this.updateScoreDisplay();
			}
		}
	}

	duel(playerChoice, enemyChoice) {
		if (playerChoice === enemyChoice) {
			return 'Tie';
		}

		// Player Wins
		if (
			(playerChoice === 'R' && enemyChoice === 'S') ||
			(playerChoice === 'P' && enemyChoice === 'R') ||
			(playerChoice === 'S' && enemyChoice === 'P')
		) {
			return 'Player';
		}

		// Enemy Wins
		return 'Enemy';
	}

	updateScoreDisplay() {
		this.scoreText.setText(
			`score: ${this.current_score
				.toString()
				.padStart(4, '0')}  high: ${this.high_score
				.toString()
				.padStart(4, '0')}`
		);
	}

	loadHighScore() {
		// Using localStorage for web persistence
		const storedScore = localStorage.getItem('rpsRunnerHighScore');
		return storedScore ? parseInt(storedScore, 10) : 0;
	}

	saveHighScore(score) {
		if (score > this.high_score) {
			this.high_score = score;
			localStorage.setItem(
				'rpsRunnerHighScore',
				this.high_score.toString()
			);
			this.updateScoreDisplay(); // Update display immediately if new high score
		}
	}

	adjustSpawnRate(currentGroundSpeed) {
		// Original speed ratio: original_ground_speed / currentGroundSpeed
		// A higher currentGroundSpeed (faster game) means the speed_factor gets smaller.
		const speed_factor = this.original_ground_speed / currentGroundSpeed;

		// Ensure a minimum allowed spawn time to prevent enemies from spawning too fast.
		const min_allowed_spawn_time = 500; // ms (0.5 seconds)

		this.min_wait_time = Math.max(
			this.base_min_spawn_duration * speed_factor,
			min_allowed_spawn_time
		);

		// Ensure max_wait_time is always greater than min_wait_time,
		// maintaining a similar range as the original times.
		const duration_range =
			this.base_max_spawn_duration - this.base_min_spawn_duration;
		this.max_wait_time = Math.max(
			this.base_max_spawn_duration * speed_factor,
			this.min_wait_time + duration_range * 0.5
		); // Ensure range is maintained

		// If the next spawn was planned based on old rates, adjust it
		// to prevent extremely long or short waits after a speed change.
		if (
			this.time_until_next_spawn > this.max_wait_time ||
			this.time_until_next_spawn < this.min_wait_time
		) {
			this.time_until_next_spawn = Phaser.Math.Between(
				this.min_wait_time,
				this.max_wait_time
			);
		}
	}
}

// --- Phaser Game Configuration ---
const config = {
	type: Phaser.AUTO, // Use WebGL if available, otherwise Canvas
	width: WINDOW_WIDTH,
	height: WINDOW_HEIGHT,
	parent: 'game-container', // ID of the div where the game canvas will be inserted
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 }, // No vertical gravity needed for this runner
			debug: false, // Set to true to see hitboxes
		},
	},
	scene: [MainScene],
};

const game = new Phaser.Game(config);
