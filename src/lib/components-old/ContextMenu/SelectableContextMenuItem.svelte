<script lang="ts">
	import classNames from 'classnames';
	import { Check } from 'radix-icons-svelte';
	import ContextMenuItem from './ContextMenuItem.svelte';

	export let selected = false;
</script>

<ContextMenuItem on:click>
	<div class="flex items-center gap-2 justify-between cursor-pointer">
		<Check
			size={20}
			class={classNames({
				'opacity-0': !selected,
				'opacity-100': selected
			})}
		/>
		<div class="flex items-center text-left w-32">
			<slot />
		</div>
	</div>
</ContextMenuItem>
