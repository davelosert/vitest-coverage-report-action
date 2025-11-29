const tableRowRegexp = /<tr>[\s\S]+?<\/tr>/g;
function getTableLine(line: number, html: string) {
	const table = html.match(/<table>.*<\/table>/);
	if (!table) {
		throw new Error("No table found");
	}
	const tableLine = table[0].match(tableRowRegexp);
	if (!tableLine) {
		throw new Error("No table line found");
	}
	return tableLine[line];
}

export { getTableLine };
