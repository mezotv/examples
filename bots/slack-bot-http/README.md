# Neon Slack Bot

A small Slack slash-command bot hosted on Neon Functions.

It supports:

- Slack request verification with `X-Slack-Signature`
- one HTTP endpoint for slash commands and interactive Block Kit button clicks
- `/neon ping` with basic request latency
- `/neon info` with runtime and request information
- `/neon help` with a dynamic help panel
- `/neon buttons` with clickable Block Kit button examples
- `/neon name` backed by Neon Postgres via Drizzle and node-postgres
- `/neon profile` showing the stored name and command usage counts
- per-user command usage tracking in Neon Postgres
- ephemeral responses by default, with `--public` for in-channel responses

## Endpoint

Use this URL in the Slack app settings as both the slash command request URL and interactivity request URL:

```text
https://your-slack-function-url.example.com/api/slack
```

The Neon function slug is `slack`. The `/api/slack` path is handled by the same function and is used for both Slack slash commands and interactive component payloads.

## Requirements

- Node.js 24 recommended
- npm 11
- Neon CLI authenticated and linked to the target Neon project
- A Slack app installed in a workspace

## Environment

Copy `.env.example` to `.env` and fill in:

```env
SLACK_SIGNING_SECRET=

# Set automatically by Neon when running `npm run deploy`.
NEON_BRANCH=
DATABASE_URL=
DATABASE_URL_UNPOOLED=
```

`SLACK_SIGNING_SECRET` is required for the hosted interaction endpoint. It comes from Slack App Settings > Basic Information > App Credentials > Signing Secret.

`NEON_BRANCH`, `DATABASE_URL`, and `DATABASE_URL_UNPOOLED` are written by Neon during `npm run deploy`. They are shown in `.env.example` for completeness; you normally do not need to fill them in by hand. The `/neon name` and `/neon profile` commands use `DATABASE_URL` to query Drizzle-managed tables.

## Install

```bash
npm install
```

## Check

```bash
npm run check
```

## Database

The `/neon name` command stores each Slack user's profile in Neon Postgres, and every slash command increments a per-user usage counter. The schema lives in `src/db/schema.ts`.

```bash
npm run db:push
```

This applies the `slack_profiles` and `slack_command_usage` tables to the database configured by `DATABASE_URL`.

## Configure Slack

This example includes `slack-app-manifest.json` as a starting point for a Slack app manifest.

Before importing or updating the manifest, replace both placeholder URLs with your deployed Neon Function URL plus `/api/slack`:

```json
"https://your-slack-function-url.example.com/api/slack"
```

The manifest configures:

- `/neon` as the slash command
- the same `/api/slack` endpoint for interactivity
- the `commands` bot scope

You can also configure these values manually in the Slack app dashboard:

- Slash Commands > Create New Command > Command: `/neon`
- Slash Commands > Request URL: your `/api/slack` URL
- Interactivity & Shortcuts > Interactivity: On
- Interactivity & Shortcuts > Request URL: your `/api/slack` URL

After changing app settings, reinstall the Slack app to the workspace if Slack prompts you to do so.

## Deploy

```bash
npm run deploy
```

This deploys the Neon Function and writes Neon-managed env vars such as `NEON_BRANCH`, `DATABASE_URL`, and `DATABASE_URL_UNPOOLED` into `.env`.

Get the current hosted function URL:

```bash
npm run endpoint
```

Append `/api/slack` before pasting the URL into Slack.

## Local Development

```bash
npm run dev
```

Neon serves the configured function from `neon.ts`.

For local Slack testing, expose the local function with a tunneling tool and use the tunnel URL plus `/api/slack` in the Slack app settings.

## Project Structure

- `neon.ts` declares the Neon Function.
- `functions/slack.ts` is the HTTP interaction handler.
- `drizzle.config.ts` configures Drizzle Kit.
- `slack-app-manifest.json` is a starter Slack app manifest.
- `src/constants/` stores command names and Slack constants.
- `src/db/schema.ts` stores the Drizzle schema.
- `src/schemas/` stores Zod validation schemas.
- `src/types/` stores TypeScript types derived from schemas or shared across modules.
- `src/utils/` stores helper logic for Slack request verification, command dispatch, Block Kit responses, and Neon Postgres access.

## Commands

`/neon ping` returns `Pong` plus the time spent handling the HTTP request.

`/neon info` renders a Block Kit panel with runtime details such as Node.js version, platform, function URL, request method, and Neon branch.

`/neon help` renders a Block Kit help panel from the supported command list.

`/neon buttons` renders a Block Kit button test panel with refresh, echo, success, and danger buttons. Each button click returns an updated panel.

`/neon name <your name>` stores your name in Neon Postgres. `/neon name` without a name reads back the stored value for your Slack user.

`/neon profile` renders a Block Kit panel with your stored name, total slash commands run, per-command usage counts, and storage details.

Add `--public` to commands such as `/neon ping --public` to post the response in-channel. Responses are ephemeral by default.

## Slack Request Flow

Slack sends slash commands and button clicks as `application/x-www-form-urlencoded` POST requests. The function verifies each request by rebuilding Slack's `v0:{timestamp}:{body}` signature base string and comparing it against `X-Slack-Signature` with the signing secret.

Slash commands are dispatched from the text after `/neon`, so adding a command means adding one entry to the command handler map.

Command usage tracking is best-effort and runs without blocking the response, so a slow analytics write never delays a reply.

Slack expects an acknowledgement within roughly three seconds. Because Neon scales to zero when idle, the first database query on a cold branch can be slow, so the database-backed `/neon name` and `/neon profile` commands fall back to a "warming up" reply if they exceed an internal deadline. Run the command again once the branch is warm.
