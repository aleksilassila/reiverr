<script lang="ts">
	import { useRegistrar } from '$lib/selectable';
	import { nestedDerived } from '$lib/utils';
	import classNames from 'classnames';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import Container from '../Container.svelte';
	import Sidebar from '../Sidebar/Sidebar.svelte';
	import { _setComponentStack, type CompStackPage } from './stack-router.store';
	import { backgroundContext } from '../GlobalBackground/background-stack.store';

	interface Props {
		page: CompStackPage;
		isHidden: boolean;
	}

	let { page, isHidden }: Props = $props();
	const registrar = useRegistrar();
	const hasFocusWithin = nestedDerived(registrar, (r) => r?.hasFocusWithin);
	const hidden = writable(isHidden);
	$effect(() => {
		hidden.set(isHidden);
	});

	const componentStack = _setComponentStack({
		...page,
		root: registrar,
		hasFocusWithin,
		isHidden: hidden
	});

	componentStack.handleMount();

	// if (page.background === true) {
	// 	backgroundContext.createContext();
	// }
</script>

<Container
	class={classNames(
		'fixed inset-0 overflow-y-auto scrollbar-hide transition-opacity duration-200 ease-linear',
		{
			'opacity-100': !isHidden,
			'opacity-0': isHidden
		}
	)}
	style="backface-visibility: hidden;"
	trapFocus={page.trapFocus}
	direction="horizontal"
	onMounted={registrar.registrar}
>
	<div in:fade|global={{ duration: 200, delay: 200 }} class="contents">
		{#if page.sidebar === true}
			<Sidebar />
		{/if}
		<Container
			class="contents"
			onBack={() => {
				// {...$$restProps}
				// handleGoToTop()
				page.close();
			}}
			focusOnMount={!isHidden}
			onNavigate={(e) => {
				// if (e.direction === 'left' && e.willLeaveContainer) {
				// 	e.preventNavigation();
				// 	focusSidebar();
				// }
			}}
		>
			<page.component {...page.props} />
		</Container>
	</div>
</Container>
