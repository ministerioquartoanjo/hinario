// Centralized version management
// Update this file to change version across all files
export const APP_VERSION = '26.03.27';

// Export for different usage contexts
export const getVersionString = () => APP_VERSION;
export const getVersionHtml = () => `<span class="text-[10px] text-gray-400">v${APP_VERSION}</span>`;
export const getVersionHtmlSmall = () => `<span class="text-[9px] text-gray-500">v${APP_VERSION}</span>`;
