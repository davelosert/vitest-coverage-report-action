
type HeadlineArgs = {
	workingDirectory?: string;
	name?: string;
}

function generateHeadline(options: HeadlineArgs) {
	if(options.name && options.workingDirectory !== './') {
		return `Coverage Report for ${options.name} (${options.workingDirectory})`;
	}

	if(options.name) {
		return `Coverage Report for ${options.name}`;
	}
	
	if(options.workingDirectory !== './') {
		return `Coverage Report for ${options.workingDirectory}`;
	}

	return "Coverage Report";
}

export { 
	generateHeadline 
};