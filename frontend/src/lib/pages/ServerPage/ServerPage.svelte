<script lang="ts">
	import Container from '$components/Container.svelte';
	import { useTabs } from '../../components/Tab/Tab';
	import Tab from '../../components/Tab/Tab.svelte';
	import TabContainer from '../../components/Tab/TabContainer.svelte';
	import TabItem from '../../components/Tab/TabItem.svelte';
	import { user } from '../../stores/user.store';
	import PageNotFound from '../PageNotFound.svelte';
	import Files from './Files.ServerPage.svelte';

	enum Tabs {
		Files
	}

	const tab = useTabs(Tabs.Files);
</script>

{#if $user?.isAdmin}
	<Container class="flex flex-col pt-16 h-screen space-y-8 px-32">
		<div class="border-b-2 border-secondary-700 pb-4 space-y-2">
			<h1 class="h1">Server</h1>
			<p class="body">Manage the server and its files.</p>
		</div>
		<div class="flex-1 flex flex-col h-full w-full space-y-8">
			<Container
				direction="horizontal"
				class="flex space-x-8"
				on:blur={({ detail: selectable }) => {
					selectable.activateChild($tab);
				}}
			>
				<TabItem selected={$tab === Tabs.Files} on:select={() => tab.set(Tabs.Files)}>
					Files
				</TabItem>
			</Container>

			<TabContainer absolute>
				<Tab {...tab} tab={Tabs.Files} class="h-full">
					<Files />
				</Tab>
			</TabContainer>
		</div>
	</Container>
{:else}
	<PageNotFound />
{/if}
