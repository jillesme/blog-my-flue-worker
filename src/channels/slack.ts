// flue-blueprint: channel/slack@1
import { defineTool, dispatch } from '@flue/runtime';
import { createSlackChannel } from '@flue/slack';
import { WebClient } from '@slack/web-api';
import * as v from 'valibot';
import { Assistant } from '../agents/assistant.ts';

export const client = new WebClient(process.env.SLACK_BOT_TOKEN);

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
						attributes: { eventId: payload.event_id },
					},
				});
				return;
			}
			default:
				return;
		}
	},
});

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
