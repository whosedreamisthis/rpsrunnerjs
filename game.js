// game.js

// --- Constants ---
import * as constants from './constants.js';

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
		this.enemies = null;
		this.ground_speed = 2; // Initial ground speed
		this.next_speed_upgrade_score_threshold =
			constants.INITIAL_SPEED_UP_SCORE;

		// Enemy spawn management
		this.time_since_last_spawn = 0;
		this.time_until_next_spawn = 0;
		this.base_min_spawn_duration =
			constants.ORIGINAL_MIN_SPAWN_DURATION * 1000;
		this.base_max_spawn_duration =
			constants.ORIGINAL_MAX_SPAWN_DURATION * 1000;
		this.min_wait_time = this.base_min_spawn_duration;
		this.max_wait_time = this.base_max_spawn_duration;

		// Properties for limiting consecutive enemies
		this.lastEnemyType = null;
		this.consecutiveEnemyCount = 0;

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
		this.isPaused = false;
		this.pausedText = null;

		// Settings UI elements
		this.settingsButton = null;
		this.settingsPanel = null;
		this.sfxToggleButtonInPanel = null;
		this.resetHsButtonInPanel = null;
		this.wasGamePausedBeforeSettings = false; // To track if game was already paused by user
		this.settingsOverlay = null;
		this.sfxEnabled = true; // SFX starts ON

		this.original_ground_speed = this.ground_speed;

		this.gameObjectBaseY =
			constants.WINDOW_HEIGHT * constants.GAME_OBJECTS_BASE_Y_RATIO -
			constants.VERTICAL_MOVE_UP_AMOUNT;
	}

	preload() {
		this.load.image('rock', constants.ASSET_URLS.rock);
		this.load.image('scissors', constants.ASSET_URLS.scissors);
		this.load.image('paper', constants.ASSET_URLS.paper);
		this.load.image('ground', constants.ASSET_URLS.ground);

		this.load.audio('coin', constants.ASSET_URLS.coinSound);
		this.load.audio('injury', constants.ASSET_URLS.injurySound);
		this.load.audio('jump', constants.ASSET_URLS.jumpSound);
	}

	create() {
		this.physics.world.setBounds(
			0,
			0,
			constants.WINDOW_WIDTH,
			constants.WINDOW_HEIGHT
		);
		this.cameras.main.setBackgroundColor(constants.OFFWHITE);

		const groundY =
			this.gameObjectBaseY + constants.GROUND_OFFSET_FROM_GAME_OBJECTS;
		this.ground1 = this.add
			.tileSprite(
				0,
				groundY,
				constants.WINDOW_WIDTH,
				constants.VISIBLE_GROUND_LINE_HEIGHT,
				'ground'
			)
			.setOrigin(0, 0);
		this.ground2 = this.add
			.tileSprite(
				constants.WINDOW_WIDTH,
				groundY,
				constants.WINDOW_WIDTH,
				constants.VISIBLE_GROUND_LINE_HEIGHT,
				'ground'
			)
			.setOrigin(0, 0);

		const groundFillY = groundY + constants.VISIBLE_GROUND_LINE_HEIGHT;
		const groundFillHeight = constants.WINDOW_HEIGHT - groundFillY;
		this.groundFill1 = this.add
			.rectangle(
				0,
				groundFillY,
				constants.WINDOW_WIDTH,
				groundFillHeight,
				constants.GROUND_FILL_COLOR
			)
			.setOrigin(0, 0);
		this.groundFill2 = this.add
			.rectangle(
				constants.WINDOW_WIDTH,
				groundFillY,
				constants.WINDOW_WIDTH,
				groundFillHeight,
				constants.GROUND_FILL_COLOR
			)
			.setOrigin(0, 0);

		this.enemies = this.physics.add.group();

		this.player = this.physics.add
			.sprite(35, this.gameObjectBaseY + 10, 'paper')
			.setScale(40 / 120)
			.setOrigin(0.5, 1);
		this.player.setCollideWorldBounds(true);
		this.player.body.setAllowGravity(false);

		this.randomizePlayerType();

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
					fontFamily: 'Courier Prime, Courier, monospace',
					fontSize: '20px',
					fill:
						'#' + constants.DARK_GRAY.toString(16).padStart(6, '0'),
					align: 'left',
				}
			)
			.setOrigin(0, 0.5);

		// --- Settings Button (rightmost) ---
		this.settingsButton = this.add
			.text(
				constants.WINDOW_WIDTH - constants.UI_TOP_RIGHT_MARGIN,
				constants.UI_BUTTON_TOP_Y,
				'⚙️',
				{
					// <--- Changed to '⚙'
					fontFamily: 'Courier Prime, Courier, monospace',
					fontSize: '30px',
					fill:
						'#' + constants.DARK_GRAY.toString(16).padStart(6, '0'),
					backgroundColor:
						'#' + constants.OFFWHITE.toString(16).padStart(6, '0'),
					padding: { left: 8, right: 8, top: 7, bottom: 5 },
				}
			)
			// ... rest of the code
			.setOrigin(1, 0.5)
			.setInteractive()
			.on('pointerdown', this.toggleSettingsPanel, this)
			.setVisible(true); // Always visible

		// --- Pause Button Setup (to the left of Settings button) ---
		const pauseButtonX =
			this.settingsButton.x -
			this.settingsButton.displayWidth -
			constants.UI_BUTTON_SPACING;

		// this.pauseButton = this.add
		// 	.text(pauseButtonX, constants.UI_BUTTON_TOP_Y, '||', {
		// 		fontFamily: 'Courier Prime, Courier, monospace',
		// 		fontSize: '20px',
		// 		fill: '#' + constants.DARK_GRAY.toString(16).padStart(6, '0'),
		// 		backgroundColor: '#' + constants.OFFWHITE.toString(16).padStart(6, '0'),
		// 		padding: { x: 8, y: 5 },
		// 	})
		// 	.setOrigin(1, 0.5)
		// 	.setInteractive()
		// 	.on('pointerdown', this.togglePause, this)
		// 	.setVisible(false); // Only visible when game starts

		// Initial mute state for Phaser's sound manager
		this.sound.mute = !this.sfxEnabled;

		this.pausedText = this.add
			.text(
				constants.WINDOW_WIDTH / 2,
				constants.WINDOW_HEIGHT / 2 - 70,
				'PAUSED',
				{
					fontFamily: 'Courier Prime, Courier, monospace',
					fontSize: '50px',
					fill:
						'#' + constants.DARK_GRAY.toString(16).padStart(6, '0'),
				}
			)
			.setOrigin(0.5)
			.setVisible(false);

		this.gameOverText = this.add
			.text(
				constants.WINDOW_WIDTH / 2,
				constants.WINDOW_HEIGHT / 2 - 70,
				'GAME OVER!',
				{
					fontFamily: 'Courier Prime, Courier, monospace',
					fontSize: '50px',
					fill:
						'#' +
						constants.ROCK_COLOR.toString(16).padStart(6, '0'),
				}
			)
			.setOrigin(0.5)
			.setVisible(false);

		// NEW: Add a full-screen, semi-transparent overlay for settings panel dismissal
		this.settingsOverlay = this.add
			.rectangle(
				0,
				0, // Position (top-left)
				constants.WINDOW_WIDTH,
				constants.WINDOW_HEIGHT, // Size
				0x000000, // Black color
				0 // Alpha (50% transparency)
			)
			.setOrigin(0, 0) // Set origin to top-left
			.setDepth(9) // Below settingsPanel (which is 10)
			.setInteractive() // Make it clickable
			.setVisible(false); // Initially hidden

		// Add click listener to the overlay to close settings
		this.settingsOverlay.on('pointerdown', this.toggleSettingsPanel, this);

		// --- Settings Panel Creation ---
		this.settingsPanel = this.add
			.container(
				constants.WINDOW_WIDTH / 2, // Centered horizontally
				constants.WINDOW_HEIGHT / 2 // Centered vertically
			)
			.setVisible(false)
			.setDepth(10); // Initially hidden

		const panelBackground = this.add
			.rectangle(
				0,
				0, // Relative to container's origin
				constants.SETTINGS_PANEL_WIDTH,
				constants.SETTINGS_PANEL_HEIGHT,
				constants.SETTINGS_PANEL_BG_COLOR
			)
			.setOrigin(0.5);
		this.settingsPanel.add(panelBackground);

		// SFX Toggle button inside panel
		this.sfxToggleButtonInPanel = this.add
			.text(
				0,
				0, // Temporary Y, will be adjusted
				this.sfxEnabled ? 'SFX: ON' : 'SFX: OFF',
				{
					fontFamily: 'Courier Prime, Courier, monospace',
					fontSize: constants.SETTINGS_PANEL_BUTTON_FONT_SIZE,
					fill:
						'#' +
						constants.SETTINGS_PANEL_TEXT_COLOR.toString(
							16
						).padStart(6, '0'),
					backgroundColor:
						'#' +
						constants.DARK_BUTTON_BACKGROUND_COLOR.toString(
							16
						).padStart(6, '0'),
					padding: {
						x: constants.SETTINGS_PANEL_BUTTON_PADDING_X,
						y: constants.SETTINGS_PANEL_BUTTON_PADDING_Y,
					},
					align: 'center',
					fixedWidth: constants.SETTINGS_PANEL_WIDTH * 0.8, // Button width relative to panel
				}
			)
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', this.toggleSFXFromPanel, this);
		this.settingsPanel.add(this.sfxToggleButtonInPanel);

		// Reset HS button inside panel
		this.resetHsButtonInPanel = this.add
			.text(
				0,
				0, // Temporary Y, will be adjusted
				'Reset High S',
				{
					fontFamily: 'Courier Prime, Courier, monospace',
					fontSize: constants.SETTINGS_PANEL_BUTTON_FONT_SIZE,
					fill:
						'#' +
						constants.SETTINGS_PANEL_TEXT_COLOR.toString(
							16
						).padStart(6, '0'),
					backgroundColor:
						'#' +
						constants.DARK_BUTTON_BACKGROUND_COLOR.toString(
							16
						).padStart(6, '0'),
					padding: {
						x: constants.SETTINGS_PANEL_BUTTON_PADDING_X,
						y: constants.SETTINGS_PANEL_BUTTON_PADDING_Y,
					},
					align: 'center',
					fixedWidth:
						constants.SETTINGS_PANEL_WIDTH *
						constants.SETTINGS_PANEL_BUTTON_FIXED_WIDTH_RATIO,
				}
			)
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', this.resetHighScorePrompt, this);
		this.settingsPanel.add(this.resetHsButtonInPanel);

		// Adjust Y positions of buttons within the panel for proper vertical centering
		const totalButtonsHeight =
			this.sfxToggleButtonInPanel.displayHeight +
			this.resetHsButtonInPanel.displayHeight +
			constants.SETTINGS_PANEL_BUTTON_SPACING_Y;
		const topButtonY =
			-(totalButtonsHeight / 2) +
			this.sfxToggleButtonInPanel.displayHeight / 2;
		this.sfxToggleButtonInPanel.y = topButtonY;
		this.resetHsButtonInPanel.y =
			topButtonY +
			this.sfxToggleButtonInPanel.displayHeight +
			constants.SETTINGS_PANEL_BUTTON_SPACING_Y;

		// --- RPS Buttons Setup ---
		const totalButtonAreaWidth =
			constants.WINDOW_WIDTH - 2 * constants.BUTTON_HORIZONTAL_PADDING;
		const singleButtonCalculatedWidth =
			(totalButtonAreaWidth - 2 * constants.BUTTON_SPACING) / 3;
		const buttonTextHeight = 32;
		const singleButtonHeight =
			buttonTextHeight + 2 * constants.BUTTON_PADDING_Y;
		const visualGroundBottomY =
			constants.WINDOW_HEIGHT * constants.GAME_OBJECTS_BASE_Y_RATIO -
			constants.VERTICAL_MOVE_UP_AMOUNT +
			constants.VISIBLE_GROUND_LINE_HEIGHT;
		const buttonY = (visualGroundBottomY + constants.WINDOW_HEIGHT) / 2;

		const rockX =
			constants.BUTTON_HORIZONTAL_PADDING +
			singleButtonCalculatedWidth / 2;
		const paperX =
			rockX + singleButtonCalculatedWidth + constants.BUTTON_SPACING;
		const scissorsX =
			paperX + singleButtonCalculatedWidth + constants.BUTTON_SPACING;

		this.rockButton = this.createRPSButton(
			rockX,
			buttonY,
			'R',
			constants.BUTTON_TEXT.R,
			'rock',
			constants.ROCK_COLOR,
			singleButtonCalculatedWidth
		);
		this.paperButton = this.createRPSButton(
			paperX,
			buttonY,
			'P',
			constants.BUTTON_TEXT.P,
			'paper',
			constants.PAPER_COLOR,
			singleButtonCalculatedWidth
		);
		this.scissorsButton = this.createRPSButton(
			scissorsX,
			buttonY,
			'S',
			constants.BUTTON_TEXT.S,
			'scissors',
			constants.SCISSORS_COLOR,
			singleButtonCalculatedWidth
		);
		this.setRPSButtonsVisibility(false);

		// Start Button - Ensured Courier font
		this.startButton = this.add
			.text(paperX, buttonY, 'START GAME', {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '32px',
				fill: '#' + constants.PAPER_COLOR.toString(16).padStart(6, '0'),
				backgroundColor:
					'#' + constants.OFFWHITE.toString(16).padStart(6, '0'),
				padding: { x: 10, y: constants.BUTTON_PADDING_Y },
				fixedWidth: singleButtonCalculatedWidth,
				align: 'center',
			})
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => this.startGame());

		// Restart Button - Ensured Courier font
		this.restartButton = this.add
			.text(paperX, buttonY, 'Restart', {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '32px',
				fill: '#' + constants.PAPER_COLOR.toString(16).padStart(6, '0'),
				backgroundColor:
					'#' + constants.OFFWHITE.toString(16).padStart(6, '0'),
				padding: { x: 10, y: constants.BUTTON_PADDING_Y },
				fixedWidth: singleButtonCalculatedWidth,
				align: 'center',
			})
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => this.startGame())
			.setVisible(false);

		this.time_until_next_spawn = Phaser.Math.Between(
			this.min_wait_time,
			this.max_wait_time
		);

		this.physics.add.overlap(
			this.player,
			this.enemies,
			this.handleCollision,
			null,
			this
		);
	}

	update(time, delta) {
		if (!this.gameStarted || this.game_over || this.isPaused) {
			return;
		}

		// --- Ground Scrolling ---
		this.ground1.x -= this.ground_speed;
		this.ground2.x -= this.ground_speed;
		this.groundFill1.x -= this.ground_speed;
		this.groundFill2.x -= this.ground_speed;

		if (this.ground1.x + this.ground1.width < 0) {
			this.ground1.x = this.ground2.x + this.ground2.width;
			this.groundFill1.x = this.groundFill2.x + this.groundFill2.width;
		}
		if (this.ground2.x + this.ground2.width < 0) {
			this.ground2.x = this.ground1.x + this.ground1.width;
			this.groundFill2.x = this.groundFill1.x + this.groundFill1.width;
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
				enemy.destroy();
			}
		});

		// --- Speed Upgrade ---
		// Loop as long as the current score has reached or exceeded the next threshold
		while (
			this.current_score > 0 &&
			this.current_score >= this.next_speed_upgrade_score_threshold
		) {
			this.ground_speed += constants.SPEED_INCREMENT_AMOUNT; // CHANGED: Speed increases by SPEED_INCREMENT_AMOUNT

			// Calculate the next threshold based on whether it's the initial or subsequent increase
			if (
				this.next_speed_upgrade_score_threshold ===
				constants.INITIAL_SPEED_UP_SCORE
			) {
				this.next_speed_upgrade_score_threshold =
					constants.INITIAL_SPEED_UP_SCORE +
					constants.SUBSEQUENT_SPEED_UP_INTERVAL;
			} else {
				this.next_speed_upgrade_score_threshold +=
					constants.SUBSEQUENT_SPEED_UP_INTERVAL;
			}
			this.adjustSpawnRate(this.ground_speed);
		}
	}

	startGame() {
		this.gameStarted = true;
		this.game_over = false;
		this.isPaused = false;
		this.current_score = 0;
		this.ground_speed = 2; // Reset initial speed
		this.time_since_last_spawn = 0;
		this.enemies.clear(true, true);

		// Reset consecutive enemy tracking on game start
		this.lastEnemyType = null;
		this.consecutiveEnemyCount = 0;

		this.spawnEnemy(); // First enemy will be spawned with no prior restrictions
		this.setRPSButtonsVisibility(true);
		this.gameOverText.setVisible(false);
		this.restartButton.setVisible(false);
		this.startButton.setVisible(false);

		// Show UI buttons
		// this.pauseButton.setVisible(true);
		this.settingsButton.setVisible(true); // Ensure settings button is visible
		this.settingsPanel.setVisible(false); // Ensure settings panel is hidden

		if (this.pausedText) {
			this.pausedText.setVisible(false);
		}
		this.randomizePlayerType(); // This will now also apply player animation
		this.updateScoreDisplay();
		this.adjustSpawnRate(this.ground_speed);
		this.next_speed_upgrade_score_threshold =
			constants.INITIAL_SPEED_UP_SCORE;

		this.physics.world.resume();
	}

	// --- NEW: Toggle Settings Panel ---
	toggleSettingsPanel() {
		if (this.settingsPanel.visible) {
			// Closing the panel
			this.settingsPanel.setVisible(false);
			this.settingsOverlay.setVisible(false);
			this.isPaused = false;
			// Resume game only if it was NOT paused by the user before opening settings
			if (!this.wasGamePausedBeforeSettings) {
				this.physics.world.resume();
			}
		} else {
			// Opening the panel
			// Store whether the game was already paused by the user before opening settings
			this.wasGamePausedBeforeSettings = this.isPaused;
			this.settingsPanel.setVisible(true);
			this.isPaused = true;
			this.settingsOverlay.setVisible(true);
			// Always pause game world when settings panel is open
			this.physics.world.pause();
		}
	}

	// --- Modified: Toggle Pause (to interact with settings panel) ---
	togglePause() {
		this.isPaused = !this.isPaused; // Toggle the user-initiated pause state

		if (this.isPaused) {
			this.physics.world.pause();
			// this.pauseButton.setText('\u25B6'); // Play icon
			this.pausedText.setVisible(true);
			// If settings panel is open while user pauses, close it
			if (this.settingsPanel.visible) {
				this.settingsPanel.setVisible(false);
				// Also update wasGamePausedBeforeSettings to reflect user-initiated pause
				this.wasGamePausedBeforeSettings = true;
			}
		} else {
			this.physics.world.resume();
			// this.pauseButton.setText('||'); // Pause icon
			this.pausedText.setVisible(false);
			// Ensure settings panel is hidden if it was open before resume logic
			if (this.settingsPanel.visible) {
				// Should be hidden by togglePause above, but defensive check
				this.settingsPanel.setVisible(false);
			}
			// Reset wasGamePausedBeforeSettings for the next time settings is opened
			this.wasGamePausedBeforeSettings = false;
		}
	}

	// --- Modified: Toggle SFX (now called from panel) ---
	toggleSFXFromPanel() {
		this.sfxEnabled = !this.sfxEnabled;
		this.sound.mute = !this.sfxEnabled; // Mute/unmute all sounds
		// Update the text on the button inside the panel
		this.sfxToggleButtonInPanel.setText(
			this.sfxEnabled ? 'SFX: ON' : 'SFX: OFF'
		);
	}

	// --- New: Reset High Score Prompt (called from panel) ---
	resetHighScorePrompt() {
		if (
			confirm(
				'Are you sure you want to reset your high score? This cannot be undone.'
			)
		) {
			this.resetHighScore();
		}
	}

	resetHighScore() {
		localStorage.removeItem('rpsRunnerHighScore'); // This clears the specific item
		this.high_score = 0; // Reset the in-game high score variable
		this.updateScoreDisplay(); // Update the display
		console.log('High score reset successfully!');
		this.toggleSettingsPanel(); // Close settings panel after reset
	}

	// --- NEW METHOD: Applies animation to the player based on current type ---
	applyPlayerAnimation() {
		// Stop any currently running tweens on the player to prevent multiple animations
		this.tweens.killTweensOf(this.player);

		// Reset player's properties to their default state before applying new animation
		this.player.rotation = 0; // Reset rotation
		this.player.setScale(40 / 120); // Reset to base scale
		// Reset Y position if it was affected by bob (to ensure consistent start for new anim)
		this.player.y = this.gameObjectBaseY + 10;

		// Apply animation based on current player type
		switch (this.playerType) {
			case 'R': // Rock: Bob up/down
				this.tweens.add({
					targets: this.player,
					y: this.player.y - constants.ROCK_BOB_AMOUNT, // Move player sprite up
					duration: constants.ROCK_BOB_DURATION,
					ease: 'Sine.easeInOut',
					yoyo: true,
					repeat: -1,
				});
				break;
			case 'P': // Paper: Rotate back and forth
				this.tweens.add({
					targets: this.player,
					rotation: { from: 0, to: constants.PAPER_ROTATE_AMOUNT },
					duration: constants.PAPER_ROTATE_DURATION,
					ease: 'Sine.easeInOut',
					yoyo: true,
					repeat: -1,
				});
				break;
			case 'S': // Scissors: Scale up/down
				const initialScale = 40 / 120;
				this.tweens.add({
					targets: this.player,
					scaleX: initialScale + constants.SCISSORS_SCALE_AMOUNT,
					scaleY: initialScale + constants.SCISSORS_SCALE_AMOUNT,
					duration: constants.SCISSORS_SCALE_DURATION,
					ease: 'Sine.easeInOut',
					yoyo: true,
					repeat: -1,
				});
				break;
			default:
				// No animation for unknown type, ensure properties are reset
				this.player.rotation = 0;
				this.player.setScale(40 / 120);
				this.player.y = this.gameObjectBaseY + 10;
				break;
		}
	}

	randomizePlayerType() {
		this.playerType = Phaser.Math.RND.pick(constants.ENEMY_TYPES);
		this.player.setTexture(this.getAssetKeyFromType(this.playerType));
		this.applyPlayerAnimation(); // Call the new animation function
	}

	createRPSButton(
		x,
		y,
		buttonType,
		buttonText,
		assetKey,
		buttonColor,
		buttonWidth
	) {
		const bgColor = '#' + constants.OFFWHITE.toString(16).padStart(6, '0');
		const textColor = '#' + buttonColor.toString(16).padStart(6, '0');

		const button = this.add
			.text(x, y, buttonText, {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '32px',
				fill: textColor,
				backgroundColor: bgColor,
				padding: {
					x: constants.BUTTON_PADDING_X,
					y: constants.BUTTON_PADDING_Y,
				},
				fixedWidth: buttonWidth,
				align: 'center',
			})
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => {
				if (!this.game_over && !this.isPaused) {
					this.playerType = buttonType;
					this.player.setTexture(assetKey);
					this.applyPlayerAnimation(); // Call the new animation function
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
		let enemyTypeToSpawn;
		let availableTypes = [...constants.ENEMY_TYPES]; // Create a mutable copy of all types

		// Logic to limit consecutive enemy types
		if (
			this.lastEnemyType !== null &&
			this.consecutiveEnemyCount >= constants.MAX_CONSECUTIVE_ENEMIES
		) {
			// If the limit is reached, filter out the last enemy type
			availableTypes = availableTypes.filter(
				(type) => type !== this.lastEnemyType
			);
			enemyTypeToSpawn = Phaser.Math.RND.pick(availableTypes);
		} else {
			// Otherwise, pick from all available types (or the filtered list if no previous enemy)
			enemyTypeToSpawn = Phaser.Math.RND.pick(availableTypes);
		}

		// Update consecutive count and last type based on the chosen enemy
		if (enemyTypeToSpawn === this.lastEnemyType) {
			this.consecutiveEnemyCount++;
		} else {
			this.consecutiveEnemyCount = 1; // Reset count for a new type
		}
		this.lastEnemyType = enemyTypeToSpawn; // Store the current type as the last one

		const enemyAssetKey = this.getAssetKeyFromType(enemyTypeToSpawn);
		const enemy = this.enemies
			.create(
				constants.WINDOW_WIDTH + 50,
				this.gameObjectBaseY + 10,
				enemyAssetKey
			)
			.setScale(40 / 120) // Initial scale
			.setOrigin(0.5, 1);
		enemy.type = enemyTypeToSpawn; // Assign the determined type to the enemy object
		enemy.body.setAllowGravity(false);
		enemy.body.setSize(enemy.width * 0.8, enemy.height * 0.8);
		enemy.body.setOffset(enemy.width * 0.1, enemy.height * 0.2);

		// Add animations based on enemy type
		switch (
			enemyTypeToSpawn // Use enemyTypeToSpawn here
		) {
			case 'R': // Rock: Bob up/down
				this.tweens.add({
					targets: enemy,
					y: enemy.y - constants.ROCK_BOB_AMOUNT,
					duration: constants.ROCK_BOB_DURATION,
					ease: 'Sine.easeInOut',
					yoyo: true,
					repeat: -1,
				});
				break;
			case 'P': // Paper: Rotate back and forth
				this.tweens.add({
					targets: enemy,
					rotation: { from: 0, to: constants.PAPER_ROTATE_AMOUNT },
					duration: constants.PAPER_ROTATE_DURATION,
					ease: 'Sine.easeInOut',
					yoyo: true,
					repeat: -1,
				});
				break;
			case 'S': // Scissors: Scale up/down
				// Store initial scale for relative scaling
				const initialScale = 40 / 120;
				this.tweens.add({
					targets: enemy,
					scaleX: initialScale + constants.SCISSORS_SCALE_AMOUNT,
					scaleY: initialScale + constants.SCISSORS_SCALE_AMOUNT,
					duration: constants.SCISSORS_SCALE_DURATION,
					ease: 'Sine.easeInOut',
					yoyo: true,
					repeat: -1,
				});
				break;
		}
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
				return 'paper';
		}
	}

	handleCollision(playerSprite, enemySprite) {
		if (
			enemySprite.active &&
			enemySprite.x <= playerSprite.x + playerSprite.width / 2 &&
			enemySprite.duelHandled !== true
		) {
			enemySprite.duelHandled = true;

			const winner = constants.GOD_MODE
				? 'Player'
				: this.duel(this.playerType, enemySprite.type);

			if (winner === 'Enemy') {
				this.sound.play('injury', { volume: constants.SFX_VOLUME });
				this.game_over = true;
				this.gameOverText.setVisible(true);
				this.restartButton.setVisible(true);
				this.setRPSButtonsVisibility(false);
				// this.pauseButton.setVisible(false); // Hide pause button on game over
				this.settingsPanel.setVisible(false); // Ensure panel is hidden on game over
				// The settings button remains visible, allowing high score reset after game over.
				this.pausedText.setVisible(false);
				this.saveHighScore(this.current_score);
			} else {
				if (winner === 'Player') {
					this.current_score += 1;
					this.sound.play('coin', { volume: constants.SFX_VOLUME });
				} else if (winner === 'Tie') {
					this.sound.play('jump', { volume: constants.SFX_VOLUME });
				}
				enemySprite.destroy();
				this.updateScoreDisplay();
			}
		}
	}

	duel(playerChoice, enemyChoice) {
		if (playerChoice === enemyChoice) {
			return 'Tie';
		}
		if (
			(playerChoice === 'R' && enemyChoice === 'S') ||
			(playerChoice === 'P' && enemyChoice === 'R') ||
			(playerChoice === 'S' && enemyChoice === 'P')
		) {
			return 'Player';
		}
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
			this.updateScoreDisplay();
		}
	}

	adjustSpawnRate(currentGroundSpeed) {
		const speed_factor = this.original_ground_speed / currentGroundSpeed;
		const min_allowed_spawn_time = 500;

		this.min_wait_time = Math.max(
			this.base_min_spawn_duration * speed_factor,
			min_allowed_spawn_time
		);
		const duration_range =
			this.base_max_spawn_duration - this.base_min_spawn_duration;
		this.max_wait_time = Math.max(
			this.base_max_spawn_duration * speed_factor,
			this.min_wait_time + duration_range * 0.5
		);

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
	type: Phaser.AUTO,
	width: constants.WINDOW_WIDTH,
	height: constants.WINDOW_HEIGHT,
	parent: 'game-container',
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 },
			debug: false,
		},
	},
	scene: [MainScene],
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
};

const game = new Phaser.Game(config);
