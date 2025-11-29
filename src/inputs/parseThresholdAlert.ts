import * as core from "@actions/core";
import type { ThresholdIcons } from "../types/ThresholdAlert";

/**
 * Parses the threshold-icons input string into a ThresholdIcons object.
 * Expected format: "{0: '🔴', 80: '🟠', 90: '🟢'}"
 *
 * @param input - The raw input string from the action
 * @returns Parsed ThresholdIcons object or undefined if input is empty or invalid
 */
function parseThresholdIcons(input: string): ThresholdIcons | undefined {
	if (!input.trim()) {
		return undefined;
	}

	try {
		// Replace single quotes with double quotes and add quotes around unquoted keys
		// This handles both JSON format and JavaScript object literal format
		const jsonString = input
			.replace(/'/g, '"')
			.replace(/(\d+)\s*:/g, '"$1":')
			.replace(/([a-zA-Z_]\w*)\s*:/g, '"$1":');

		const parsed = JSON.parse(jsonString);

		// Validate the parsed object
		if (typeof parsed !== "object" || parsed === null) {
			core.warning(`Invalid threshold-icons format: expected an object`);
			return undefined;
		}

		const result: ThresholdIcons = {};
		for (const key of Object.keys(parsed)) {
			const numKey = Number(key);
			if (Number.isNaN(numKey)) {
				core.warning(
					`Invalid threshold-icons key "${key}": expected a number`,
				);
				continue;
			}
			if (typeof parsed[key] !== "string") {
				core.warning(
					`Invalid threshold-icons value for key "${key}": expected a string`,
				);
				continue;
			}
			result[numKey] = parsed[key];
		}

		if (Object.keys(result).length === 0) {
			core.warning(`threshold-icons has no valid entries`);
			return undefined;
		}

		return result;
	} catch (error) {
		core.warning(
			`Failed to parse threshold-icons: ${error instanceof Error ? error.message : String(error)}`,
		);
		return undefined;
	}
}

export { parseThresholdIcons };
