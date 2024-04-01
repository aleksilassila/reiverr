<script lang="ts">
	import FullScreenModal from '../FullScreenModal.svelte';
	import { radarrApi } from '../../../apis/radarr/radarr-api';
	import ReleaseList from './ReleaseList.svelte';
	import Container from '../../../../Container.svelte';
	import { scrollWithOffset } from '../../../selectable';
	import FullScreenModalContainer from '../FullScreenModalContainer.svelte';

	export let id: number;
	export let modalId: symbol;
</script>

<FullScreenModal {modalId}>
	<FullScreenModalContainer>
		<h1 slot="header">Download</h1>
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
	</FullScreenModalContainer>
</FullScreenModal>
