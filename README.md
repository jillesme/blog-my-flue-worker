# my-flue-worker

A [Flue](https://flueframework.com) agent project.

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

Then send a message:

```sh
curl -X POST http://localhost:5173/agents/assistant/my-first-chat \
  -H 'content-type: application/json' \
  -d '{"kind":"user","body":"Generate a random number."}'
```

The Assistant agent is served at `http://localhost:5173/agents/assistant`.

## Deploy

```sh
npm run deploy
```

## Learn more

- [Flue docs](https://flueframework.com/docs/) — or `npx flue docs` from the terminal.
