import { inject } from '@vercel/analytics';

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
	inject();
};
