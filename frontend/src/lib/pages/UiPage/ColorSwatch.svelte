<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import classNames from 'classnames';
	import { onMount } from 'svelte';

	export let label: string;
	/** A background class written out in full, so that Tailwind generates it */
	export let background: string;

	let element: HTMLElement;
	let value = '';

	// The computed color in the notation of tailwind.config.js
	function toHsl(rgb: string): string {
		const [r = 0, g = 0, b = 0, a = 1] = rgb.match(/[\d.]+/g)?.map(Number) ?? [];

		const max = Math.max(r, g, b) / 255;
		const min = Math.min(r, g, b) / 255;
		const l = (max + min) / 2;
		const d = max - min;
		const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
		const h =
			d === 0
				? 0
				: max === r / 255
					? ((g - b) / 255 / d + (g < b ? 6 : 0)) * 60
					: max === g / 255
						? ((b - r) / 255 / d + 2) * 60
						: ((r - g) / 255 / d + 4) * 60;

		const hsl = `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
		return a < 1 ? `hsla(${hsl}, ${a})` : `hsl(${hsl})`;
	}

	onMount(() => {
		value = toHsl(getComputedStyle(element).backgroundColor);
	});
</script>

<Container class="flex-1 min-w-0 max-w-[10rem] group" let:hasFocus>
	<div
		bind:this={element}
		class={classNames(
			'h-20 rounded-xl border-2 group-hover:border-primary-500',
			background,
			hasFocus ? 'border-primary-500' : 'border-transparent'
		)}
	/>
	<div
		class={classNames('mt-2 font-semibold', hasFocus ? 'text-primary-500' : 'text-secondary-200')}
	>
		{label}
	</div>
	<div class="text-sm text-secondary-400 truncate">{value}</div>
</Container>
