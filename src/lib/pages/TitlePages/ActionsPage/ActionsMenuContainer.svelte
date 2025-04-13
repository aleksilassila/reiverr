<script>
	import ComponentStackContainer from '$lib/components/ComponentStack/ComponentStackContainer.svelte';
	import Container from '$lib/components/Container.svelte';
	import { titlePageContext } from '$lib/pages/TitlePages/ActionsPage/actions-page';
	import classNames from 'classnames';

	const { componentStack } = titlePageContext.getContext();
</script>

<ComponentStackContainer trapFocus hideSidebar>
	<Container
		class={classNames(
			'pt-16 px-32 flex flex-col min-h-screen bg-primary-900/50 backdrop-blur-md backdrop-brightness-[0.2] backdrop-saturate-50',
			$$restProps.class
		)}
		on:back={({ detail }) => {
			componentStack.pop();
			detail.stopPropagation();
		}}
	>
		<slot />
	</Container>
</ComponentStackContainer>
