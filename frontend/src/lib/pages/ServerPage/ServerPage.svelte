<script lang="ts">
	import Container from '$components/Container.svelte';
	import { useTabs } from '../../components/Tab/Tab';
	import Tab from '../../components/Tab/Tab.svelte';
	import TabContainer from '../../components/Tab/TabContainer.svelte';
	import TabItem from '../../components/Tab/TabItem.svelte';
	import { user } from '../../stores/user.store';
	import PageNotFound from '../PageNotFound.svelte';
	import Files from './Files.ServerPage.svelte';
	import Logs from './Logs.ServerPage.svelte';

	enum Tabs {
		Files,
		Logs
	}

	const tab = useTabs(Tabs.Files);
</script>

{#if $user?.isAdmin}
	<Container class="flex flex-col pt-16 h-screen space-y-8 px-32">
		<div class="divider-lg pb-4 flex items-end justify-between">
			<div class="space-y-2">
				<h1 class="h1">Server</h1>
				<p class="body">Manage the server and its files.</p>
			</div>
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
				<TabItem selected={$tab === Tabs.Logs} on:select={() => tab.set(Tabs.Logs)}>Logs</TabItem>
			</Container>
		</div>
		<div class="flex-1 flex flex-col h-full w-full">
			<TabContainer absolute>
				<Tab {...tab} tab={Tabs.Files} class="h-full">
					<Files />
				</Tab>
				<Tab {...tab} tab={Tabs.Logs} class="h-full">
					<Logs />
				</Tab>
			</TabContainer>
		</div>
	</Container>
{:else}
	<PageNotFound />
{/if}
