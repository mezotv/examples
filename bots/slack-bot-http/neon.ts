import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: {
    functions: {
      slack: {
        name: "Slack interactions",
        source: "./functions/slack.ts",
        env: {
          SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET ?? "",
        },
        dev: {
          port: 8787,
        },
      },
    },
  },
});
