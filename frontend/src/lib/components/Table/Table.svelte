<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ContainerProps } from '$lib/components/Container.type';
	import Container from '../Container.svelte';

	type Props = Omit<ContainerProps, 'children'> & {
		rows: number;
		header?: Snippet;
		children?: Snippet;
	};

	let { rows, header, children, ...rest }: Props = $props();
</script>

<table class="w-full grid">
	<thead>
		{@render header?.()}
	</thead>
	<Container tag="tbody" {...rest}>
		{@render children?.()}
	</Container>
</table>
