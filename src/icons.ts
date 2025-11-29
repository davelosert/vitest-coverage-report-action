import type { ThresholdIcons } from "./types/ThresholdIcons";

const icons = {
	red: "🔴",
	green: "🟢",
	blue: "🔵",
	increase: "⬆️",
	decrease: "⬇️",
	equal: "🟰",
	target: "🎯",
};

/**
 * Default threshold icons that show blue for all coverage percentages.
 * Used when no custom threshold-icons are provided.
 */
const defaultThresholdIcons: ThresholdIcons = {
	0: icons.blue,
};

export { icons, defaultThresholdIcons };
