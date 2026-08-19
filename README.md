# my-flue-worker

A [Flue](https://flueframework.com) agent project.

Companion code for [Creating a Slack Flue agent](https://jilles.me/creating-a-slack-flue-agent/).

## Setup

```sh
npm install
```

This agent uses Cloudflare Workers AI, so it does not need a model provider API key.

## Develop

Cloudflare Workers AI requires the Cloudflare runtime, so start the local Worker:

```sh
npm run dev
```

Slack Events API requests are served at `POST /channels/slack/events`. Mention
the bot in Slack to start or continue a thread-bound agent conversation.

## Deploy

```sh
npm run deploy
```

## Learn more

- [Flue docs](https://flueframework.com/docs/) — or `npx flue docs` from the terminal.
