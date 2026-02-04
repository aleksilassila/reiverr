<script>
	import ComponentStackContainer from '$lib/components/ComponentStack/ComponentStackContainer.svelte';
	import Container from '$lib/components/Container.svelte';
	import ActionPageTitle from '$lib/pages/TitlePages/ActionsPage/ActionPageTitle.svelte';
	import { titlePageContext } from '$lib/pages/TitlePages/ActionsPage/actions-page';
	import classNames from 'classnames';

	const { componentStack } = titlePageContext.getContext();
</script>

<ComponentStackContainer trapFocus sidebar={false}>
	<Container
		class={classNames(
			'pt-16 px-32 flex flex-col min-h-screen bg-primary-900/50',
			$$restProps.class
		)}
		on:back={({ detail }) => {
			componentStack.pop();
			detail.stopPropagation();
		}}
	>
		<ActionPageTitle />
		<div
			class="overflow-y-auto overflow-x-hidden scrollbar-hide pb-16 mx-32"
			style="backface-visibility: hidden"
		>
			<slot />
		</div>
	</Container>
</ComponentStackContainer>
