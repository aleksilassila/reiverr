<script lang="ts" module>
	import type { ContainerProps } from './Container.type';

	/**
	 * A container of the tree. The name is the key of the container among its siblings, the name of
	 * its selectable and its test id.
	 *
	 * @example
	 * { name: 'row', direction: 'horizontal', children: [{ name: 'play' }, { name: 'more' }] }
	 */
	export type TreeNode = Omit<ContainerProps, 'children' | 'name' | 'selectable'> & {
		name: string;
		children?: TreeNode[];
	};
</script>

<script lang="ts">
	import Container from './Container.svelte';
	import ContainerTree from './ContainerTree.fixture.svelte';

	let { nodes }: { nodes: TreeNode[] } = $props();
</script>

{#each nodes as { name, children, ...props } (name)}
	<Container {name} data-testid={name} {...props}>
		{#if children}
			<ContainerTree nodes={children} />
		{/if}
	</Container>
{/each}
