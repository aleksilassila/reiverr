<script lang="ts">
	import FullScreenModal from '../Modal/FullScreenModal.svelte';
	import { radarrApi } from '../../apis/radarr/radarr-api';
	import ReleaseList from './ReleaseList.svelte';
	import Container from '../../../Container.svelte';
	import { scrollWithOffset } from '../../selectable';

	export let id: number;
	export let modalId: symbol;
</script>

<FullScreenModal {modalId}>
	<div class="max-h-full mx-auto flex flex-col py-32 max-w-2xl">
		<h1 class="tracking-wide text-2xl font-semibold mb-4">Download</h1>
		<Container
			childrenRevealStrategy={scrollWithOffset('all', 10)}
			class="flex-1 overflow-y-scroll"
		>
			<ReleaseList
				{id}
				grabRelease={radarrApi.downloadRadarrMovie}
				getReleases={radarrApi.fetchRadarrReleases}
			/>
		</Container>
	</div>
</FullScreenModal>
