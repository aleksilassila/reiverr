<script lang="ts">
	import Container from '../Container.svelte';
	import type { useTabs } from './Tab';
	import Tab from './Tab.svelte';
	import TabContainer from './TabContainer.svelte';

	let { tab }: { tab: ReturnType<typeof useTabs> } = $props();
</script>

<Container name="page">
	<TabContainer>
		<Tab {...tab.props} tab={0}>
			<Container name="first-a" />
			<Container name="first-b" />
		</Tab>
		<Tab {...tab.props} tab={1}>
			<Container name="second-a" />
			<Container name="second-b" focusedChild />
		</Tab>
	</TabContainer>
</Container>
