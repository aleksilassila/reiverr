<script>
	import ComponentStackContainer from '$lib/components/ComponentStack/ComponentStackContainer.svelte';
	import Container from '$lib/components/Container.svelte';
	import { titlePageContext } from '$lib/pages/TitlePages/ActionsPage/actions-page';

	const { componentStack } = titlePageContext.getContext();
</script>

<ComponentStackContainer trapFocus>
	<Container
		class="py-16 px-32 bg-primary-800 space-y-8 flex flex-col min-h-screen"
		on:back={({ detail }) => {
			componentStack.pop();
			detail.stopPropagation();
		}}
	>
		<slot />
	</Container>
</ComponentStackContainer>
