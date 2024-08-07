import { defineConfig } from "vite";

export default defineConfig({
	test: {
		coverage: {
			all: true,
			reporter: ["text-summary", "json-summary", "json"],
			include: ["src"],
			exclude: ["src/types", "**/*.test.ts"],
		},
	},
});
