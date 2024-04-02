<script lang="ts">
	import classNames from 'classnames';
	import { modalStack } from '../Modal/modal.store';
	import Container from '../../../Container.svelte';
	import VideoPlayer from './VideoPlayer.svelte';

	export let id: string;
	export let modalId: symbol;
	export let hidden: boolean = false;
</script>

<Container
	navigationActions={{}}
	focusOnMount
	trapFocus
	class={classNames('fixed inset-0 bg-black overflow-auto', {
		'opacity-0': hidden
	})}
>
	<VideoPlayer jellyfinId={id} />
</Container>
