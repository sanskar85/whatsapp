import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
	verbose: true,
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	setupFiles: ['./tests/env.ts'],
};
export default config;
