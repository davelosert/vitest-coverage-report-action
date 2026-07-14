/**
 * ThresholdIcons maps coverage percentage thresholds to status icons.
 * Keys are threshold percentages and values are the icons to display.
 * The icon for the highest threshold not exceeding the coverage percentage is used.
 *
 * Example: { 0: '🔴', 80: '🟠', 90: '🟢' }
 * - 0-79%: 🔴
 * - 80-89%: 🟠
 * - 90-100%: 🟢
 */
type ThresholdIcons = Record<number, string>;

/** The resolved ThresholdIcons map to use for each coverage category. */
type ThresholdIconsByCategory = {
	lines: ThresholdIcons;
	statements: ThresholdIcons;
	functions: ThresholdIcons;
	branches: ThresholdIcons;
};

export type { ThresholdIcons, ThresholdIconsByCategory };
