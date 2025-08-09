<script lang="ts">
	import Container from '../Container.svelte';
	import classNames from 'classnames';
	import MMTitle from './MMTitle.svelte';

	// let activeTab: 'releases' | 'local-files' = 'releases';
</script>

<div class="flex flex-col h-screen">
	<div class="flex items-center pb-8 mb-8 pt-16 px-32">
		<div class="flex-1">
			<MMTitle>
				<slot name="title" slot="title" />
				<slot name="subtitle" slot="subtitle" />
			</MMTitle>
		</div>
		<div class="mx-20">
			<!--			<h1 class="mb-2">Downloads</h1>-->
			<slot name="downloads" />
		</div>
	</div>
	<Container focusOnMount direction="horizontal" class="flex-1 grid grid-cols-1 min-h-0">
		<slot />
	</Container>
</div>
