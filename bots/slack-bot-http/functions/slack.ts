import { SLACK_INTERACTIONS_PATH } from "../src/constants/slack.js";
import { getSlackEnv } from "../src/env.js";
import { slackInteractionPayloadSchema, slackSlashCommandSchema } from "../src/schemas/slack.js";
import { commandHandlers, parseSlackCommandText, trackSlackCommandRun } from "../src/utils/slackCommands.js";
import {
  createButtonTestClickResponseData,
  createErrorResponseData,
  parseButtonTestActionId,
} from "../src/utils/slackResponses.js";
import { jsonResponse } from "../src/utils/jsonResponse.js";
import { verifySlackRequest } from "../src/utils/verifySlackRequest.js";

const parseFormBody = (body: string): Record<string, string> => Object.fromEntries(new URLSearchParams(body));

const handleSlackInteraction = (payloadBody: string | undefined): Response => {
  if (!payloadBody) {
    return jsonResponse(createErrorResponseData("Missing Slack interaction payload."), { status: 400 });
  }

  let payloadJson: unknown;

  try {
    payloadJson = JSON.parse(payloadBody);
  } catch {
    return jsonResponse(createErrorResponseData("Invalid Slack interaction payload JSON."), { status: 400 });
  }

  const parsedPayload = slackInteractionPayloadSchema.safeParse(payloadJson);

  if (!parsedPayload.success) {
    return jsonResponse(createErrorResponseData("Invalid Slack interaction payload."), { status: 400 });
  }

  const actionId = parsedPayload.data.actions[0]?.action_id;

  if (!actionId) {
    return jsonResponse(createErrorResponseData("Slack interaction did not include an action ID."), { status: 400 });
  }

  const buttonTestAction = parseButtonTestActionId(actionId);

  if (buttonTestAction) {
    return jsonResponse(createButtonTestClickResponseData(buttonTestAction));
  }

  return jsonResponse(createErrorResponseData("That button is not handled by this bot."));
};

export default async function handler(request: Request): Promise<Response> {
  const requestReceivedAtMs = Date.now();
  const url = new URL(request.url);

  switch (request.method) {
    case "GET":
      return jsonResponse({
        ok: true,
        service: "slack-interactions",
        interactionsPath: SLACK_INTERACTIONS_PATH,
        interactionsUrl: `${url.origin}${SLACK_INTERACTIONS_PATH}`,
      });
    case "POST":
      break;
    default:
      return jsonResponse({ error: "method not allowed" }, { status: 405 });
  }

  const body = await request.text();
  const env = getSlackEnv();
  const isVerified = verifySlackRequest({
    body,
    signingSecret: env.SLACK_SIGNING_SECRET,
    signature: request.headers.get("x-slack-signature"),
    timestamp: request.headers.get("x-slack-request-timestamp"),
  });

  if (!isVerified) {
    return jsonResponse({ error: "invalid request signature" }, { status: 401 });
  }

  const formBody = parseFormBody(body);

  if (formBody.ssl_check === "1") {
    return new Response(undefined, { status: 200 });
  }

  if (formBody.payload) {
    return handleSlackInteraction(formBody.payload);
  }

  const parsedPayload = slackSlashCommandSchema.safeParse(formBody);

  if (!parsedPayload.success) {
    return jsonResponse(createErrorResponseData("Invalid Slack slash command payload."), { status: 400 });
  }

  const payload = parsedPayload.data;
  const parsedCommand = parseSlackCommandText(payload.text);
  const commandHandler = commandHandlers[parsedCommand.commandName];

  if (!commandHandler) {
    return jsonResponse(
      createErrorResponseData(
        `Unknown command \`${parsedCommand.commandName}\`. Try \`${payload.command} help\`.`,
      ),
    );
  }

  void trackSlackCommandRun(payload, parsedCommand.commandName);

  return jsonResponse(
    await commandHandler({
      payload,
      request,
      url,
      requestReceivedAtMs,
      ...parsedCommand,
    }),
  );
}
