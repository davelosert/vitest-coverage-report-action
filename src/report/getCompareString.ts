import { icons } from "../icons";

function getCompareString(percentDiff: number, decimalPlaces = 2): string {
	if (percentDiff === 0) {
		return `${icons.equal} <em>±0%</em>`;
	}

	if (percentDiff > 0) {
		return `${icons.increase} <em>+${percentDiff.toFixed(decimalPlaces)}%</em>`;
	}

	// The - char is already included in a negative number
	return `${icons.decrease} <em>${percentDiff.toFixed(decimalPlaces)}%</em>`;
}

export { getCompareString };
