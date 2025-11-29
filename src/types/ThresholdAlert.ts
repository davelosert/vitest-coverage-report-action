/**
 * A threshold alert maps coverage percentage thresholds to status icons.
 * Keys are threshold percentages and values are the icons to display.
 * The icon for the highest threshold not exceeding the coverage percentage is used.
 *
 * Example: { 0: '🔴', 80: '🟠', 90: '🟢' }
 * - 0-79%: 🔴
 * - 80-89%: 🟠
 * - 90-100%: 🟢
 */
type ThresholdAlert = Record<number, string>;

export type { ThresholdAlert };
