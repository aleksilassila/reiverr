<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import { useTabs } from '$lib/components/Tab/Tab';
	import Tab from '$lib/components/Tab/Tab.svelte';
	import TabContainer from '$lib/components/Tab/TabContainer.svelte';
	import TabItem from '$lib/components/Tab/TabItem.svelte';
	import { setScrollContext } from '$lib/stores/scroll.store';
	import MyListTab from './MyListTab.svelte';

	const { registrar: scrollRegistrar } = setScrollContext();

	const tab = useTabs(0);
</script>

<Container
	class="pt-16 space-y-8 min-h-screen flex flex-col"
	focusOnMount
	on:mount={({ detail }) => {
		const el = detail.getHtmlElement();

		if (el) {
			scrollRegistrar(el);
		}
	}}
>
	<Container
		direction="horizontal"
		class="divider-lg pb-4 mx-32 mb-8 flex space-x-8"
		on:blur={({ detail: selectable }) => {
			selectable.activateChild($tab);
		}}
	>
		<TabItem class="text-4xl tracking-wider" selected={$tab === 0} on:select={() => tab.set(0)}>
			My List
		</TabItem>
		<TabItem class="text-4xl tracking-wider" disabled>Downloaded</TabItem>
	</Container>
	<Container focusOnMount class="contents">
		<TabContainer class="flex-1 flex *:flex-1">
			<Tab class="h-full" tab={0} {...tab}>
				<MyListTab />
			</Tab>
		</TabContainer>
	</Container>
</Container>
