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

const initialDataSchema = v.object({
	channelId: v.string(),
	threadTs: v.string(),
});

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
		if (!messageTs) return;
		await addEyesReaction({ channel: data.channelId, timestamp: messageTs });
		setPendingReactionTimestamps((timestamps) =>
			timestamps.includes(messageTs) ? timestamps : [...timestamps, messageTs],
		);
	});

	useAgentFinish(async () => {
		if (pendingReactionTimestamps.length === 0) return;
		await Promise.all(
			pendingReactionTimestamps.map((timestamp) =>
				removeEyesReaction({ channel: data.channelId, timestamp }),
			),
		);
		setPendingReactionTimestamps([]);
	});

	useTool(replyInThread(data));
	useTool({
		name: 'generate_random_number',
		description: 'Generate and return a random integer from 1 through 100. Use this when the user asks for a random number.',
		run: () => ({ output: { value: Math.floor(Math.random() * 100) + 1 } }),
	});

	return 'You are a helpful Slack assistant. Keep replies short. Always send answers with the reply_in_slack_thread tool. When asked for a random number, call the generate_random_number tool and include its result in that reply.';
}

Assistant.initialData = initialDataSchema;
