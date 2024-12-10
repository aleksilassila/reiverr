<script lang="ts">
	import classNames from 'classnames';
	import Container from '../../../Container.svelte';
	import type { VideoStreamCandidateDto, MediaSource } from '../../apis/reiverr/reiverr.openapi';
	import { scrollIntoView } from '../../selectable';
	import { capitalize } from '../../utils';
	import StreamDetailsDialog from './StreamDetailsDialog.MoviePage.svelte';
	import { modalStack } from '../../components/Modal/modal.store';

	export let streams: Map<MediaSource, Promise<VideoStreamCandidateDto[]>>;
	export let createStreamDetailsDialog: (source: MediaSource, stream: VideoStreamCandidateDto) => void;
</script>

<Container
	class="flex-1 bg-secondary-950 pt-8 pb-16 px-32 flex flex-col"
	on:enter={scrollIntoView({ top: 32 })}
>
	{#each [...streams.keys()] as source}
		<h1 class="font-medium tracking-wide text-2xl text-zinc-300 mb-8">
			{capitalize(source.id)}
		</h1>
		{#await streams.get(source)}
			Loading...
		{:then streams}
			<Container
				direction="grid"
				gridCols={2}
				class={classNames('grid gap-8', {
					'grid-cols-1': (streams || []).length < 2,
					'grid-cols-2': (streams || []).length >= 2
				})}
			>
				{#each streams || [] as stream}
					<Container
						class={classNames(
							'flex space-x-8 items-center text-zinc-300 font-medium relative overflow-hidden',
							'px-8 py-4 border-2 border-transparent rounded-xl',
							{
								'bg-secondary-800 focus-within:bg-primary-700 focus-within:border-primary-500': true,
								'hover:bg-primary-700 hover:border-primary-500 cursor-pointer': true
								// 'bg-primary-700 focus-within:border-primary-500': selected,
								// 'bg-secondary-800 focus-within:border-zinc-300': !selected
							}
						)}
						on:clickOrSelect={() => createStreamDetailsDialog(source, stream)}
						on:enter={scrollIntoView({ vertical: 128 })}
						focusOnClick
					>
						<div class="flex-1">
							<h1 class="text-lg">
								{stream.title}
							</h1>
						</div>
						{#each stream.properties.slice(0, 2) as property}
							<div>
								{property.formatted ?? property.value}
							</div>
						{/each}
						<!-- <div>
						{file?.mediaInfo?.runTime}
					</div>
					<div>
						{formatSize(file?.size || 0)}
					</div> -->
					</Container>
				{/each}
			</Container>
		{/await}
	{/each}
</Container>
