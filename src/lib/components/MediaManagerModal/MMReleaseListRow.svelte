<script lang="ts">
	import { formatMinutesToTime, formatSize } from '../../utils.js';
	import type { RadarrRelease } from '../../apis/radarr/radarr-api';
	import type { SonarrRelease } from '../../apis/sonarr/sonarr-api';
	import Container from '../../../Container.svelte';
	import classNames from 'classnames';
	import { scrollIntoView } from '../../selectable';
	import { Download } from 'radix-icons-svelte';
	import type { Readable } from 'svelte/store';
	export let release: RadarrRelease | SonarrRelease;

	let hasFocusWithin: Readable<boolean>;
</script>

<Container
	tag="tr"
	class={classNames('h-20 font-medium transition-transform px-4 py-2 rounded-lg relative', {
		// 'scale-[102%] bg-primary-500/10': $hasFocusWithin
	})}
	bind:hasFocusWithin
	on:enter={scrollIntoView({ vertical: 64 })}
>
	<td class="pl-8">
		<!-- Background, has to be inside a td to not create another column -->
		<div
			class={classNames('absolute inset-0 -z-10 rounded-xl transition-colors', {
				'bg-secondary-800 border-primary-500 shadow-xl shadow-secondary-900': $hasFocusWithin,
				'bg-transparent border-transparent': !$hasFocusWithin
			})}
		/>

		<h2 class="text-sm font-medium text-zinc-300 mb-1">
			{formatMinutesToTime(release.ageMinutes || 0)} ago
		</h2>
		<h1 class="font-medium text-lg">{release.title}</h1></td
	>
	<td class="text-zinc-300">
		{formatSize(release.size || 0)}
	</td>
	<td class="text-zinc-300">
		<div
			class="px-3 py-1 rounded bg-secondary-700 flex items-center justify-center float-left text-sm"
		>
			{release.seeders} / {release.leechers}
		</div>
	</td>
	<td class="text-zinc-300">
		<div
			class="px-3 py-1 rounded bg-secondary-700 flex items-center justify-center float-left text-sm"
		>
			{release.quality?.quality?.name}
		</div>
	</td>
	<td class="">
		<!--		<Container let:hasFocus on:enter={scrollIntoView({ vertical: 64 })}>-->
		<!--			<div-->
		<!--				class={classNames(-->
		<!--					'border-2 rounded-2xl p-1 cursor-pointer font-medium tracking-wide transition-colors',-->
		<!--					{-->
		<!--						'border-zinc-300': !hasFocus,-->
		<!--						'border-primary-500': hasFocus-->
		<!--					}-->
		<!--				)}-->
		<!--			>-->
		<!--				<div-->
		<!--					class={classNames(-->
		<!--						'px-4 py-2 rounded-xl flex items-center justify-center transition-colors',-->
		<!--						{-->
		<!--							'bg-primary-500 text-secondary-800': hasFocus,-->
		<!--							'bg-transparent': !hasFocus-->
		<!--						}-->
		<!--					)}-->
		<!--				>-->
		<!--					Download-->
		<!--					<Download class="ml-2" size={19} />-->
		<!--				</div>-->
		<!--			</div>-->
		<!--		</Container>-->
		<Container let:hasFocus class="pr-8">
			<div
				class={classNames(
					'border-2 rounded-2xl p-1 cursor-pointer font-medium tracking-wide transition-colors',
					{
						'border-zinc-400': !hasFocus,
						'border-primary-500': hasFocus
					}
				)}
			>
				<div
					class={classNames(
						'px-2 py-2 rounded-xl flex items-center justify-center transition-colors',
						{
							'bg-primary-500 text-secondary-800': hasFocus,
							'bg-transparent': !hasFocus
						}
					)}
				>
					<Download size={19} />
				</div>
			</div>
		</Container>
	</td>
</Container>
