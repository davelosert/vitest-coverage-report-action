import { defaultThresholdIcons, icons } from "../icons";
import type { Thresholds } from "../types/Threshold";
import type {
	ThresholdIcons,
	ThresholdIconsByCategory,
} from "../types/ThresholdIcons";

function resolveCategoryIcons(
	threshold: number | undefined,
	explicitThresholdIcons: ThresholdIcons | undefined,
): ThresholdIcons {
	if (explicitThresholdIcons) {
		return explicitThresholdIcons;
	}

	if (threshold !== undefined) {
		return { 0: icons.red, [threshold]: icons.green };
	}

	return defaultThresholdIcons;
}

/**
 * Explicit threshold-icons win; otherwise each category falls back to
 * pass/fail against its own vitest threshold, or blue if neither is set.
 */
function resolveThresholdIcons(
	thresholds: Thresholds,
	explicitThresholdIcons: ThresholdIcons | undefined,
): ThresholdIconsByCategory {
	return {
		lines: resolveCategoryIcons(thresholds.lines, explicitThresholdIcons),
		statements: resolveCategoryIcons(
			thresholds.statements,
			explicitThresholdIcons,
		),
		functions: resolveCategoryIcons(
			thresholds.functions,
			explicitThresholdIcons,
		),
		branches: resolveCategoryIcons(thresholds.branches, explicitThresholdIcons),
	};
}

export { resolveThresholdIcons };
