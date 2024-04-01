<script lang="ts">
	import FullScreenModal from '../Modal/FullScreenModal.svelte';
	import { radarrApi } from '../../apis/radarr/radarr-api';
	import ReleaseList from './ReleaseList.svelte';

	export let id: number;
	export let modalId: symbol;
</script>

<FullScreenModal {modalId}>
	<div class="m-auto flex flex-col items-center my-16">
		<div>
			<h1 class="tracking-wide text-2xl font-semibold mb-4">Download</h1>
			<ReleaseList
				{id}
				grabRelease={radarrApi.downloadRadarrMovie}
				getReleases={radarrApi.fetchRadarrReleases}
			/>
		</div>
	</div>
</FullScreenModal>
