<script lang="ts">
	import classNames from 'classnames';
	import { SpeakerLoud, SpeakerModerate, SpeakerOff, SpeakerQuiet } from 'radix-icons-svelte';
	import Container from '../Container.svelte';
	import Slider from './Slider.svelte';

	interface Props {
		/** From 0 to 1, 0 when muted */
		volume: number;
		onVolumeChange: (volume: number) => void;
		onToggleMute: () => void;
	}

	let { volume, onVolumeChange, onToggleMute }: Props = $props();

	let Icon = $derived.by(() => {
		if (volume === 0) return SpeakerOff;
		if (volume < 1 / 3) return SpeakerQuiet;
		if (volume < 2 / 3) return SpeakerModerate;
		return SpeakerLoud;
	});
</script>

<!-- An icon button that grows a slider while the pointer is on it, or drags the slider from outside it
	(active). The slider is before the icon, so that at the right end of a row the icon stays under the pointer -->
<Container onClickOrSelect={onToggleMute} class="cursor-pointer group">
	{#snippet children({ hasFocus })}
		<div
			class={classNames(
				'flex items-center rounded-full transition-colors duration-200',
				'group-hover:bg-primary-500 group-hover:text-secondary-800',
				'group-active:bg-primary-500 group-active:text-secondary-800',
				{
					'bg-primary-500 text-secondary-800': hasFocus
				}
			)}
		>
			<!-- The slider keeps its place next to the icon and its color, and is uncovered from the icon outwards -->
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				class={classNames(
					'self-stretch flex items-center justify-end overflow-hidden cursor-default text-secondary-800',
					'w-0 opacity-0 transition-[width,opacity] duration-200',
					'group-hover:w-32 group-hover:opacity-100 group-active:w-32 group-active:opacity-100'
				)}
				onclick={(e) => e.stopPropagation()}
			>
				<div class="w-28 ml-4 flex-shrink-0">
					<Slider value={volume} onChange={onVolumeChange} />
				</div>
			</div>
			<div class="p-3">
				<Icon size={24} />
			</div>
		</div>
	{/snippet}
</Container>
