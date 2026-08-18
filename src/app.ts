import { createAgentRouter } from '@flue/runtime/routing';
import { Hono } from 'hono';
import { Assistant } from './agents/assistant.ts';
import { channel as slack } from './channels/slack.ts';

const app = new Hono();

// The route map: every agent, channel, and custom route is mounted here
// explicitly. Talk to Assistant with one POST per message:
//
//   curl -X POST http://localhost:5173/agents/assistant/my-first-chat \
//     -H 'content-type: application/json' \
//     -d '{"kind":"user","body":"Generate a random number."}'
app.route('/agents/assistant', createAgentRouter(Assistant));
app.route('/channels/slack', slack.route());

export default app;
