import { inject } from '@vercel/analytics';

export const load: LayoutLoad = async ({}) => {
	inject();
    return {};
};
