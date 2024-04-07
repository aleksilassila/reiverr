<script lang="ts">
	import Container from '../../../../Container.svelte';
	import type { MovieFileResource, RadarrRelease } from '../../../apis/radarr/radarr-api';
	import { formatSize } from '../../../utils';
	import Button from '../../Button.svelte';
	import FullScreenModal from '../../Modal/FullScreenModal.svelte';
	import FullScreenModalContainer from '../ManageMediaMenuLayout.svelte';
	import { useActionRequest, useRequest } from '../../../stores/data.store';
	import { Download, Plus } from 'radix-icons-svelte';
	import type { SonarrRelease } from '../../../apis/sonarr/sonarr-api';
	import type { Release } from '../../../apis/combined-types';

	export let modalId: symbol;
	export let release: Release;
	export let status: undefined | 'downloading' | 'downloaded' = undefined;
	export let grabRelease: (guid: string, indexerId: number) => Promise<boolean>;

	const {
		send: handleGrabRelease,
		isFetching,
		data
	} = useActionRequest((guid: string, indexerId: number) => grabRelease(guid, indexerId));
</script>

<FullScreenModal {modalId}>
	<FullScreenModalContainer>
		<div slot="header" class="flex">
			<h1 class="line-clamp-1 flex-1 mr-4">
				{release.title}
			</h1>
			<h1 class="text-zinc-300">{formatSize(release.size || 0)}</h1>
		</div>
		<Container>
			<div class="-my-1">
				<Button
					focusOnMount
					on:click={() => handleGrabRelease(release.guid || '', release.indexerId || -1)}
					inactive={!!($data || $isFetching || status)}
				>
					{#if $data || status === 'downloading'}
						Downloading...
					{:else if status === 'downloaded'}
						Downloaded
					{:else}
						Download
					{/if}

					<svelte:component
						this={$data || status ? Download : Plus}
						size={19}
						slot="icon"
						class="mr-2"
					/>
				</Button>
			</div>
		</Container>
	</FullScreenModalContainer>
</FullScreenModal>
