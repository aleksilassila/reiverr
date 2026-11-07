<script lang="ts">
	import type { ComponentProps, Snippet } from 'svelte';
	import classNames from 'classnames';
	import { Check } from 'radix-icons-svelte';
	import ContextMenuItem from './ContextMenuItem.svelte';

	interface Props {
		onclick?: ComponentProps<typeof ContextMenuItem>['onclick'];
		selected?: boolean;
		children?: Snippet;
	}

	let { selected = false, children, onclick }: Props = $props();
</script>

<ContextMenuItem {onclick}>
	<div class="flex items-center gap-2 justify-between cursor-pointer">
		<Check
			size={20}
			class={classNames({
				'opacity-0': !selected,
				'opacity-100': selected
			})}
		/>
		<div class="flex items-center text-left w-32">
			{@render children?.()}
		</div>
	</div>
</ContextMenuItem>
