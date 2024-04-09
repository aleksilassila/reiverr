<script lang="ts">
	import FullScreenModal from '../../Modal/FullScreenModal.svelte';
	import ReleaseList from '../ReleaseList.svelte';
	import type { Release } from '../../../apis/combined-types';

	export let modalId: symbol;
	export let hidden: boolean;
	export let getReleases: () => Promise<Release[]>;
	export let selectRelease: (release: Release) => void;
</script>

<FullScreenModal {modalId} {hidden}>
	<ReleaseList {getReleases} {selectRelease} />
</FullScreenModal>
