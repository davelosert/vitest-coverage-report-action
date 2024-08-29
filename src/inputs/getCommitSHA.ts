import * as github from "@actions/github";

type Context = typeof github.context;
type Payload = Context["payload"];
type PRPayload = NonNullable<Payload["pull_request"]>;

type PRContext = Context & {
	payload: Payload & {
		pull_request: PRPayload;
	};
};

function isPRContext(context: typeof github.context): context is PRContext {
	return (
		context.eventName === "pull_request" ||
		context.eventName === "pull_request_target"
	);
}

function getCommitSHA(): string {
	if (isPRContext(github.context)) {
		return github.context.payload.pull_request.head.sha;
	}

	if (github.context.eventName === "workflow_run") {
		return github.context.payload.workflow_run.head_commit.id;
	}

	// For all other events, just return the current SHA
	return github.context.sha;
}

export { getCommitSHA };
