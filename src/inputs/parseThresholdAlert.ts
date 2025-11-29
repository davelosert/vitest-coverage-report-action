import * as core from "@actions/core";
import type { ThresholdAlert } from "../types/ThresholdAlert";

/**
 * Parses the threshold-alert input string into a ThresholdAlert object.
 * Expected format: "{0: '🔴', 80: '🟠', 90: '🟢'}"
 *
 * @param input - The raw input string from the action
 * @returns Parsed ThresholdAlert object or undefined if input is empty or invalid
 */
function parseThresholdAlert(input: string): ThresholdAlert | undefined {
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
			core.warning(`Invalid threshold-alert format: expected an object`);
			return undefined;
		}

		const result: ThresholdAlert = {};
		for (const key of Object.keys(parsed)) {
			const numKey = Number(key);
			if (Number.isNaN(numKey)) {
				core.warning(
					`Invalid threshold-alert key "${key}": expected a number`,
				);
				continue;
			}
			if (typeof parsed[key] !== "string") {
				core.warning(
					`Invalid threshold-alert value for key "${key}": expected a string`,
				);
				continue;
			}
			result[numKey] = parsed[key];
		}

		if (Object.keys(result).length === 0) {
			core.warning(`threshold-alert has no valid entries`);
			return undefined;
		}

		return result;
	} catch (error) {
		core.warning(
			`Failed to parse threshold-alert: ${error instanceof Error ? error.message : String(error)}`,
		);
		return undefined;
	}
}

export { parseThresholdAlert };
