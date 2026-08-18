'use agent';
import { useInitialData, useModel, useTool } from '@flue/runtime';
import * as v from 'valibot';
import { replyInThread } from '../channels/slack.ts';

const initialDataSchema = v.optional(
	v.object({
		channelId: v.string(),
		threadTs: v.string(),
		startedBy: v.optional(v.string()),
		startedAt: v.pipe(v.string(), v.isoTimestamp()),
	}),
);

export function Assistant() {
	useModel('cloudflare/@cf/google/gemma-4-26b-a4b-it');
	const data = useInitialData<v.InferOutput<typeof initialDataSchema>>();
	if (data) useTool(replyInThread(data));
	useTool({
		name: 'generate_random_number',
		description: 'Generate and return a random integer from 1 through 100. Use this when the user asks for a random number.',
		harness: true,
		run: () => ({ output: { value: Math.floor(Math.random() * 100) + 1 } }),
	});

	if (data) {
		const startedBy = data.startedBy ? ` by <@${data.startedBy}>` : '';
		return `You are a helpful assistant. Keep replies short. This Slack conversation was started${startedBy} at ${data.startedAt}. Always send your answer with the reply_in_slack_thread tool. When the user asks for a random number, call the generate_random_number tool and include its result in your Slack reply.`;
	}

	return 'You are a helpful assistant. Keep replies short. When the user asks for a random number, call the generate_random_number tool and include its result in your reply.';
}

Assistant.initialData = initialDataSchema;
