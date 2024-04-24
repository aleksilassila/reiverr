<script lang="ts">
	import Container from '../../../Container.svelte';
	import type { Readable } from 'svelte/store';
	import AnimateScale from '../AnimateScale.svelte';
	import classNames from 'classnames';
	import { Plus, PlusCircled } from 'radix-icons-svelte';

	export let backdropUrl: string;

	let hasFocus: Readable<boolean>;
</script>

<AnimateScale hasFocus={$hasFocus}>
	<Container
		class={classNames(
			'w-full h-64',
			'flex flex-col shrink-0',
			'overflow-hidden rounded-2xl cursor-pointer group relative selectable transition-opacity'
		)}
		on:clickOrSelect
		bind:hasFocus
	>
		<div
			class="bg-cover bg-center absolute inset-0"
			style={`background-image: url('${backdropUrl}')`}
		/>
		<div class="absolute inset-0 bg-secondary-800/75 flex items-center justify-center">
			<div class="rounded-full p-2.5 bg-secondary-800/75">
				<Plus size={32} />
			</div>
		</div>
	</Container>
</AnimateScale>
