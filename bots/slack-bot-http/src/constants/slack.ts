export const SLACK_INTERACTIONS_PATH = "/api/slack";

export const SLACK_SIGNATURE_VERSION = "v0";

export const SLACK_MAX_SIGNATURE_AGE_SECONDS = 60 * 5;

export const SLACK_DB_RESPONSE_DEADLINE_MS = 2500;

export const SLACK_ROOT_COMMAND_NAME = "neon";

export const SLACK_PING_COMMAND_NAME = "ping";

export const SLACK_PING_COMMAND_DESCRIPTION = "Return pong with basic request latency.";

export const SLACK_INFO_COMMAND_NAME = "info";

export const SLACK_INFO_COMMAND_DESCRIPTION = "Show runtime and request information for this bot.";

export const SLACK_HELP_COMMAND_NAME = "help";

export const SLACK_HELP_COMMAND_DESCRIPTION = "Show a help panel for this bot.";

export const SLACK_BUTTONS_COMMAND_NAME = "buttons";

export const SLACK_BUTTONS_COMMAND_DESCRIPTION = "Show a Block Kit button test panel.";

export const SLACK_NAME_COMMAND_NAME = "name";

export const SLACK_NAME_COMMAND_DESCRIPTION = "Save or view your stored display name.";

export const SLACK_PROFILE_COMMAND_NAME = "profile";

export const SLACK_PROFILE_COMMAND_DESCRIPTION = "Show your stored profile and command usage.";

export const SLACK_PUBLIC_RESPONSE_FLAG = "--public";

export const SLACK_BUTTON_TEST_ACTION_ID_PREFIX = "button-test";

export const SLACK_BUTTON_TEST_ACTIONS = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  SUCCESS: "success",
  DANGER: "danger",
} as const;

export const SLACK_APPLICATION_COMMANDS = [
  {
    name: SLACK_PING_COMMAND_NAME,
    description: SLACK_PING_COMMAND_DESCRIPTION,
    usage: `${SLACK_PING_COMMAND_NAME} [${SLACK_PUBLIC_RESPONSE_FLAG}]`,
  },
  {
    name: SLACK_INFO_COMMAND_NAME,
    description: SLACK_INFO_COMMAND_DESCRIPTION,
    usage: `${SLACK_INFO_COMMAND_NAME} [${SLACK_PUBLIC_RESPONSE_FLAG}]`,
  },
  {
    name: SLACK_HELP_COMMAND_NAME,
    description: SLACK_HELP_COMMAND_DESCRIPTION,
    usage: `${SLACK_HELP_COMMAND_NAME} [${SLACK_PUBLIC_RESPONSE_FLAG}]`,
  },
  {
    name: SLACK_BUTTONS_COMMAND_NAME,
    description: SLACK_BUTTONS_COMMAND_DESCRIPTION,
    usage: `${SLACK_BUTTONS_COMMAND_NAME}`,
  },
  {
    name: SLACK_NAME_COMMAND_NAME,
    description: SLACK_NAME_COMMAND_DESCRIPTION,
    usage: `${SLACK_NAME_COMMAND_NAME} [your name] [${SLACK_PUBLIC_RESPONSE_FLAG}]`,
  },
  {
    name: SLACK_PROFILE_COMMAND_NAME,
    description: SLACK_PROFILE_COMMAND_DESCRIPTION,
    usage: `${SLACK_PROFILE_COMMAND_NAME} [${SLACK_PUBLIC_RESPONSE_FLAG}]`,
  },
];
