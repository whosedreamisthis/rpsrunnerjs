// game.js

// --- Constants ---
const WINDOW_WIDTH = 700;
const WINDOW_HEIGHT = 350;
const GAME_OBJECTS_BASE_Y_RATIO = 0.75;
const GROUND_OFFSET_FROM_GAME_OBJECTS = 0;

const ENEMY_TYPES = ['R', 'P', 'S'];
const INITIAL_SPEED_UP_SCORE = 3; // First speed up happens when score hits 3
const SUBSEQUENT_SPEED_UP_INTERVAL = 10; // Speed up every 10 points after that (e.g., 13, 23, 33...)
const SPEED_INCREMENT_AMOUNT = 1; // NEW: How much speed increases per threshold (e.g., 1.0, 1.5, 2.0)

const GOD_MODE = false;

// Colors
const WHITE = 0xffffff;
const BLACK = 0x000000;
const GREEN = 0x00c800;
const DARK_GRAY = 0x313638;
const OFFWHITE = 0xf0f0f0;
const ROCK_COLOR = 0x59c3c3;
const PAPER_COLOR = 0x774c60;
const SCISSORS_COLOR = 0x84a98c;
const DARK_BUTTON_BACKGROUND_COLOR = 0x1a1a1a;

// Ground appearance
const VISIBLE_GROUND_LINE_HEIGHT = 25;
const GROUND_FILL_COLOR = 0x000000;

// Vertical adjustment for ground and hands
const VERTICAL_MOVE_UP_AMOUNT = 25;

// Original spawn times in SECONDS
const ORIGINAL_MIN_SPAWN_DURATION = 2.0; // seconds
const ORIGINAL_MAX_SPAWN_DURATION = 4.0; // seconds

// UI Button Constants
const BUTTON_HORIZONTAL_PADDING = 20;
const BUTTON_SPACING = 10;
const BUTTON_PADDING_X = 20;
const BUTTON_PADDING_Y = 15;
const PAUSE_BUTTON_RIGHT_MARGIN = 20;

// Button Text Content
const BUTTON_TEXT = {
	R: 'R',
	P: 'P',
	S: 'S',
};

// Asset URLs
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

const SFX_VOLUME = 0.5;

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
		this.next_speed_upgrade_score_threshold = INITIAL_SPEED_UP_SCORE;

		// Enemy spawn management
		this.time_since_last_spawn = 0;
		this.time_until_next_spawn = 0;
		this.base_min_spawn_duration = ORIGINAL_MIN_SPAWN_DURATION * 1000;
		this.base_max_spawn_duration = ORIGINAL_MAX_SPAWN_DURATION * 1000;
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
		this.isPaused = false;
		this.pausedText = null;

		this.original_ground_speed = this.ground_speed;

		this.gameObjectBaseY =
			WINDOW_HEIGHT * GAME_OBJECTS_BASE_Y_RATIO - VERTICAL_MOVE_UP_AMOUNT;
	}

	preload() {
		this.load.image('rock', ASSET_URLS.rock);
		this.load.image('scissors', ASSET_URLS.scissors);
		this.load.image('paper', ASSET_URLS.paper);
		this.load.image('ground', ASSET_URLS.ground);

		this.load.audio('coin', ASSET_URLS.coinSound);
		this.load.audio('injury', ASSET_URLS.injurySound);
		this.load.audio('jump', ASSET_URLS.jumpSound);
	}

	create() {
		this.physics.world.setBounds(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
		this.cameras.main.setBackgroundColor(OFFWHITE);

		const groundY = this.gameObjectBaseY + GROUND_OFFSET_FROM_GAME_OBJECTS;
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
					fill: '#' + DARK_GRAY.toString(16).padStart(6, '0'),
					align: 'left',
				}
			)
			.setOrigin(0, 0.5);

		this.pauseButton = this.add
			.text(WINDOW_WIDTH - PAUSE_BUTTON_RIGHT_MARGIN, 20, '||', {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '20px',
				fill: '#' + DARK_GRAY.toString(16).padStart(6, '0'),
				backgroundColor: '#' + OFFWHITE.toString(16).padStart(6, '0'),
			})
			.setOrigin(1, 0.5)
			.setInteractive()
			.on('pointerdown', this.togglePause, this)
			.setVisible(false);

		this.pausedText = this.add
			.text(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2 - 70, 'PAUSED', {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '50px',
				fill: '#' + DARK_GRAY.toString(16).padStart(6, '0'),
			})
			.setOrigin(0.5)
			.setVisible(false);

		this.gameOverText = this.add
			.text(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2 - 70, 'GAME OVER!', {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '50px',
				fill: '#' + ROCK_COLOR.toString(16).padStart(6, '0'),
			})
			.setOrigin(0.5)
			.setVisible(false);

		// --- RPS Buttons Setup ---
		const totalButtonAreaWidth =
			WINDOW_WIDTH - 2 * BUTTON_HORIZONTAL_PADDING;
		const singleButtonCalculatedWidth =
			(totalButtonAreaWidth - 2 * BUTTON_SPACING) / 3;
		const buttonTextHeight = 32;
		const singleButtonHeight = buttonTextHeight + 2 * BUTTON_PADDING_Y;
		const visualGroundBottomY =
			WINDOW_HEIGHT * GAME_OBJECTS_BASE_Y_RATIO -
			VERTICAL_MOVE_UP_AMOUNT +
			VISIBLE_GROUND_LINE_HEIGHT;
		const buttonY = (visualGroundBottomY + WINDOW_HEIGHT) / 2;

		const rockX =
			BUTTON_HORIZONTAL_PADDING + singleButtonCalculatedWidth / 2;
		const paperX = rockX + singleButtonCalculatedWidth + BUTTON_SPACING;
		const scissorsX = paperX + singleButtonCalculatedWidth + BUTTON_SPACING;

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
		this.setRPSButtonsVisibility(false);

		// Start Button - Ensured Courier font
		this.startButton = this.add
			.text(paperX, buttonY, 'START GAME', {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '32px',
				fill: '#' + PAPER_COLOR.toString(16).padStart(6, '0'),
				backgroundColor: '#' + OFFWHITE.toString(16).padStart(6, '0'),
				padding: { x: 10, y: BUTTON_PADDING_Y },
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
				fill: '#' + PAPER_COLOR.toString(16).padStart(6, '0'),
				backgroundColor: '#' + OFFWHITE.toString(16).padStart(6, '0'),
				padding: { x: 10, y: BUTTON_PADDING_Y },
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
			this.ground_speed += SPEED_INCREMENT_AMOUNT; // CHANGED: Speed increases by SPEED_INCREMENT_AMOUNT

			// Calculate the next threshold based on whether it's the initial or subsequent increase
			if (
				this.next_speed_upgrade_score_threshold ===
				INITIAL_SPEED_UP_SCORE
			) {
				this.next_speed_upgrade_score_threshold =
					INITIAL_SPEED_UP_SCORE + SUBSEQUENT_SPEED_UP_INTERVAL;
			} else {
				this.next_speed_upgrade_score_threshold +=
					SUBSEQUENT_SPEED_UP_INTERVAL;
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
		this.spawnEnemy();
		this.setRPSButtonsVisibility(true);
		this.gameOverText.setVisible(false);
		this.restartButton.setVisible(false);
		this.startButton.setVisible(false);
		this.pauseButton.setVisible(true);
		this.pauseButton.setText('||');
		if (this.pausedText) {
			this.pausedText.setVisible(false);
		}
		this.randomizePlayerType();
		this.updateScoreDisplay();
		this.adjustSpawnRate(this.ground_speed);
		this.next_speed_upgrade_score_threshold = INITIAL_SPEED_UP_SCORE;

		this.physics.world.resume();
	}

	togglePause() {
		this.isPaused = !this.isPaused;

		if (this.isPaused) {
			this.physics.world.pause();
			this.pauseButton.setText('\u25B6');
			this.pausedText.setVisible(true);
		} else {
			this.physics.world.resume();
			this.pausedText.setVisible(false);
		}
	}

	randomizePlayerType() {
		this.playerType = Phaser.Math.RND.pick(ENEMY_TYPES);
		this.player.setTexture(this.getAssetKeyFromType(this.playerType));
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
		const bgColor = '#' + OFFWHITE.toString(16).padStart(6, '0');
		const textColor = '#' + buttonColor.toString(16).padStart(6, '0');

		const button = this.add
			.text(x, y, buttonText, {
				fontFamily: 'Courier Prime, Courier, monospace',
				fontSize: '32px',
				fill: textColor,
				backgroundColor: bgColor,
				padding: { x: BUTTON_PADDING_X, y: BUTTON_PADDING_Y },
				fixedWidth: buttonWidth,
				align: 'center',
			})
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => {
				if (!this.game_over && !this.isPaused) {
					this.playerType = buttonType;
					this.player.setTexture(assetKey);
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
		const enemy = this.enemies
			.create(WINDOW_WIDTH + 50, this.gameObjectBaseY + 10, enemyAssetKey)
			.setScale(40 / 120)
			.setOrigin(0.5, 1);
		enemy.type = enemyType;
		enemy.body.setAllowGravity(false);
		enemy.body.setSize(enemy.width * 0.8, enemy.height * 0.8);
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

			const winner = GOD_MODE
				? 'Player'
				: this.duel(this.playerType, enemySprite.type);

			if (winner === 'Enemy') {
				this.sound.play('injury', { volume: SFX_VOLUME });
				this.game_over = true;
				this.gameOverText.setVisible(true);
				this.restartButton.setVisible(true);
				this.setRPSButtonsVisibility(false);
				this.pauseButton.setVisible(false);
				this.pausedText.setVisible(false);
				this.saveHighScore(this.current_score);
			} else {
				if (winner === 'Player') {
					this.current_score += 1;
					this.sound.play('coin', { volume: SFX_VOLUME });
				} else if (winner === 'Tie') {
					this.sound.play('jump', { volume: SFX_VOLUME });
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
	width: WINDOW_WIDTH,
	height: WINDOW_HEIGHT,
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
