import type { Registrar } from '$lib/selectable';

export type StackRouterPageProps = {
	handleGoBack: () => void;
	registrar: Registrar;
};
