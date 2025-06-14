// constants.js

// --- Game Dimensions and Ratios ---
export const WINDOW_WIDTH = 700;
export const WINDOW_HEIGHT = 350;
export const GAME_OBJECTS_BASE_Y_RATIO = 0.75;
export const GROUND_OFFSET_FROM_GAME_OBJECTS = 0;

// --- Game Logic Constants ---
export const ENEMY_TYPES = ['R', 'P', 'S'];
export const INITIAL_SPEED_UP_SCORE = 3; // First speed up happens when score hits 3
export const SUBSEQUENT_SPEED_UP_INTERVAL = 10; // Speed up every 10 points after that (e.g., 13, 23, 33...)
export const SPEED_INCREMENT_AMOUNT = 1; // How much speed increases per threshold
export const GOD_MODE = false; // For debugging/testing

// --- Colors (Hexadecimal) ---
export const WHITE = 0xffffff;
export const BLACK = 0x000000;
export const GREEN = 0x00c800;
export const DARK_GRAY = 0x313638;
export const OFFWHITE = 0xf0f0f0;
export const ROCK_COLOR = 0x59c3c3;
export const PAPER_COLOR = 0x774c60;
export const SCISSORS_COLOR = 0x84a98c;
export const DARK_BUTTON_BACKGROUND_COLOR = 0x1a1a1a;

// --- Ground Appearance ---
export const VISIBLE_GROUND_LINE_HEIGHT = 25;
export const GROUND_FILL_COLOR = 0x000000;

// --- Vertical Adjustments ---
export const VERTICAL_MOVE_UP_AMOUNT = 25;

// --- Enemy Spawning Durations (in seconds) ---
export const ORIGINAL_MIN_SPAWN_DURATION = 2.0; // seconds
export const ORIGINAL_MAX_SPAWN_DURATION = 4.0; // seconds

// --- UI Button Constants ---
export const BUTTON_HORIZONTAL_PADDING = 20;
export const BUTTON_SPACING = 10;
export const BUTTON_PADDING_X = 20;
export const BUTTON_PADDING_Y = 15;
export const UI_TOP_RIGHT_MARGIN = 20; // Margin from the right edge for the rightmost UI element
export const UI_BUTTON_TOP_Y = 20; // Y position for top-right UI buttons
export const UI_BUTTON_SPACING = 10; // Spacing between top-right UI buttons (like Pause and SFX)

// --- Animation Constants ---
export const ROCK_BOB_AMOUNT = 5; // Pixels up/down for Rock animation
export const ROCK_BOB_DURATION = 600; // ms for Rock animation

export const PAPER_ROTATE_AMOUNT = 0.08; // Radians (approx 4.5 degrees) for Paper animation
export const PAPER_ROTATE_DURATION = 800; // ms for Paper animation

export const SCISSORS_SCALE_AMOUNT = 0.02; // Relative scale increase for Scissors animation
export const SCISSORS_SCALE_DURATION = 700; // ms for Scissors animation

// --- Enemy Spawning Rules ---
export const MAX_CONSECUTIVE_ENEMIES = 3; // Max number of times the same enemy type can appear in a row

// --- Settings Panel Constants ---
export const SETTINGS_PANEL_WIDTH = 200;
export const SETTINGS_PANEL_HEIGHT = 120;
export const SETTINGS_PANEL_BG_COLOR = 0x313638; // Dark gray
export const SETTINGS_PANEL_TEXT_COLOR = 0xffffff; // White
export const SETTINGS_PANEL_BUTTON_PADDING_X = 15;
export const SETTINGS_PANEL_BUTTON_PADDING_Y = 10;
export const SETTINGS_PANEL_BUTTON_SPACING_Y = 15; // Vertical spacing between buttons inside panel
export const SETTINGS_PANEL_BUTTON_FONT_SIZE = '20px'; // Font size for buttons in panel
export const SETTINGS_PANEL_BUTTON_FIXED_WIDTH_RATIO = 0.9; // Adjusted to give more room for text

// --- Button Text Content ---
export const BUTTON_TEXT = {
	R: 'R',
	P: 'P',
	S: 'S',
};

// --- Asset URLs ---
export const ASSET_URLS = {
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

// --- Sound Effects Volume ---
export const SFX_VOLUME = 0.1;
