<script lang="ts">
	import Container from '../../../Container.svelte';
	import classNames from 'classnames';

	let activeTab: 'releases' | 'local-files' = 'releases';
</script>

<div class="flex flex-col h-screen">
	<div class="flex items-center pb-8 mb-8 pt-16 px-32">
		<div class="flex-1">
			<div class="text-4xl font-semibold">
				<slot name="title" />
			</div>
			<div class="text-zinc-300 font-medium text-lg mt-2">
				<slot name="subtitle" />
			</div>
		</div>
		<div class="mx-20">
			<h1 class="mb-2">Downloads</h1>
			<slot name="downloads" />
		</div>
	</div>
	<div class="flex mb-8 mx-32">
		<button
			class={classNames('text-2xl font-semibold mr-8 transition-opacity cursor-pointer', {
				'opacity-40': activeTab !== 'releases'
			})}
			on:click={() => (activeTab = 'releases')}
		>
			Releases
		</button>
		<button
			class={classNames('text-2xl font-semibold mr-8 transition-opacity cursor-pointer', {
				'opacity-40': activeTab !== 'local-files'
			})}
			on:click={() => (activeTab = 'local-files')}
		>
			Local Files
		</button>
	</div>
	<Container focusOnMount direction="horizontal" class="flex-1 grid grid-cols-1 min-h-0">
		<Container
			focusOnMount
			on:enter={() => (activeTab = 'releases')}
			class={classNames(
				'row-start-1 col-start-1 pb-16 mx-20',
				'transition-all overflow-y-auto overflow-x-hidden scrollbar-hide',
				{
					'opacity-30 -translate-x-full': activeTab !== 'releases'
				}
			)}
		>
			<slot name="releases" />
		</Container>
		<Container
			on:enter={() => (activeTab = 'local-files')}
			class={classNames(
				'row-start-1 col-start-1 pb-16 mx-20',
				'transition-all overflow-y-auto overflow-x-hidden scrollbar-hide',
				{
					'opacity-30 translate-x-full': activeTab !== 'local-files'
				}
			)}
		>
			<slot name="local-files" />
		</Container>
	</Container>
	<!--	<Container direction="horizontal" class="grid grid-cols-1 gap-16">-->
	<!--		<div class="flex flex-col">-->
	<!--			<h1 class="text-2xl font-semibold mb-4">Releases</h1>-->
	<!--			<slot name="releases" />-->
	<!--		</div>-->
	<!--		<div class="flex flex-col">-->
	<!--			<div class="flex flex-col mb-8">-->
	<!--				<h1 class="text-2xl font-semibold mb-4">Local Files</h1>-->
	<!--				<slot name="local-files" />-->
	<!--			</div>-->

	<!--			<div class="flex flex-col mb-8">-->
	<!--				<h1 class="text-2xl font-semibold mb-4">Downloads</h1>-->
	<!--				<slot name="downloads" />-->
	<!--			</div>-->
	<!--		</div>-->
	<!--	</Container>-->
</div>
