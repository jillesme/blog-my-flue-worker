// flue-blueprint: channel/slack@1
import { defineTool, dispatch } from '@flue/runtime';
import { createSlackChannel } from '@flue/slack';
import { type ReactionsAddArguments, WebAPIPlatformError, WebClient } from '@slack/web-api';
import * as v from 'valibot';
import { Assistant } from '../agents/assistant.ts';

// Slack's WebClient defaults to an unbound global fetch and redirect: 'error'.
// Cloudflare requires the global receiver and supports only 'follow'/'manual'.
// A manual redirect still reaches Slack's non-200 handling without following it.
export const client = new WebClient(process.env.SLACK_BOT_TOKEN, {
	fetch: (url, init) =>
		globalThis.fetch(url, {
			...init,
			redirect: init?.redirect === 'error' ? 'manual' : init?.redirect,
		}),
});

export const channel = createSlackChannel({
	signingSecret: process.env.SLACK_SIGNING_SECRET!,

	// Path: /channels/slack/events
	async events({ payload }) {
		if (payload.type !== 'event_callback') return;

		switch (payload.event.type) {
			case 'app_mention': {
				const event = payload.event;
				const thread = {
					teamId: payload.team_id,
					channelId: event.channel,
					threadTs: event.thread_ts ?? event.ts,
				};
				await dispatch(Assistant, {
					id: channel.instanceId(thread),
					initialData: {
						channelId: thread.channelId,
						threadTs: thread.threadTs,
						startedBy: event.user,
						startedAt: new Date(Number(event.ts) * 1000).toISOString(),
					},
					message: {
						kind: 'signal',
						type: 'slack.app_mention',
						body: event.text,
						attributes: {
							eventId: payload.event_id,
							messageTs: event.ts
						},
					},
				});
				return;
			}
			default:
				return;
		}
	},
});

type SlackMessageRef = Pick<ReactionsAddArguments, 'channel' | 'timestamp'>;

export async function addEyesReaction(ref: SlackMessageRef) {
	try {
		await client.reactions.add({ ...ref, name: 'eyes' });
	} catch (error) {
		if (error instanceof WebAPIPlatformError && error.data.error === 'already_reacted') return;
		throw error;
	}
}

export async function removeEyesReaction(ref: SlackMessageRef) {
	try {
		await client.reactions.remove({ ...ref, name: 'eyes' });
	} catch (error) {
		if (error instanceof WebAPIPlatformError && error.data.error === 'no_reaction') return;
		throw error;
	}
}

export function replyInThread(ref: { channelId: string; threadTs: string }) {
	return defineTool({
		name: 'reply_in_slack_thread',
		description: 'Reply in the Slack thread bound to this agent.',
		input: v.object({ text: v.pipe(v.string(), v.minLength(1)) }),
		async run({ data }) {
			const result = await client.chat.postMessage({
				channel: ref.channelId,
				thread_ts: ref.threadTs,
				text: data.text,
			});
			return {
				output: {
					...(result.channel === undefined ? {} : { channel: result.channel }),
					...(result.ts === undefined ? {} : { ts: result.ts }),
				},
			};
		},
	});
}
