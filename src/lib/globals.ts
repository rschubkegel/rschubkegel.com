/**
 * Global constants used across the application
 */

export const LOGO_PRESS_KEY = 'logo-pressed';

/**
 * Function to set the logo as pressed in localStorage
 * This enables emoji reactions functionality
 */
export const setLogoPressed = (value = true) => {
	localStorage.setItem(LOGO_PRESS_KEY, value.toString());
	// Trigger storage event for same-tab updates
	window.dispatchEvent(new StorageEvent('storage', {
		key: LOGO_PRESS_KEY,
		newValue: value.toString(),
		storageArea: localStorage
	}));
};
