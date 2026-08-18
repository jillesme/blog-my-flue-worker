'use agent';
import {
	useAgentFinish,
	useAgentStart,
	useDelivery,
	useInitialData,
	useModel,
	usePersistentState,
	useTool,
} from '@flue/runtime';
import * as v from 'valibot';
import { addEyesReaction, removeEyesReaction, replyInThread } from '../channels/slack.ts';

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
	const delivery = useDelivery();
	const messageTs = delivery.kind === 'signal' ? delivery.attributes?.messageTs : undefined;
	const [pendingReactionTimestamps, setPendingReactionTimestamps] = usePersistentState<string[]>(
		'pendingSlackReactionTimestamps',
		[],
	);

	useAgentStart(async () => {
		if (!data || !messageTs) return;
		await addEyesReaction({ channel: data.channelId, timestamp: messageTs });
		setPendingReactionTimestamps((timestamps) =>
			timestamps.includes(messageTs) ? timestamps : [...timestamps, messageTs],
		);
	});

	useAgentFinish(async () => {
		if (!data || pendingReactionTimestamps.length === 0) return;
		await Promise.all(
			pendingReactionTimestamps.map((timestamp) =>
				removeEyesReaction({ channel: data.channelId, timestamp }),
			),
		);
		setPendingReactionTimestamps([]);
	});

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
