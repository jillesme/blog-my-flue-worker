'use agent';
import { useModel, useTool } from '@flue/runtime';

export function Assistant() {
	useModel('cloudflare/@cf/google/gemma-4-26b-a4b-it');
	useTool({
		name: 'generate_random_number',
		description: 'Generate and return a random integer from 1 through 100. Use this when the user asks for a random number.',
		harness: true,
		run: () => ({ output: { value: Math.floor(Math.random() * 100) + 1 } }),
	});
	return 'You are a helpful assistant. Keep replies short. When the user asks for a random number, call the generate_random_number tool and include its result in your reply.';
}
