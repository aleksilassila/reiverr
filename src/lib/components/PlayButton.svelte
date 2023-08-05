<script>
	import { TriangleRight } from 'radix-icons-svelte';
	import IconButton from './IconButton.svelte';
	import classNames from 'classnames';
</script>

<div class={classNames($$restProps.class, 'backdrop-blur-lg rounded-full p-1 bg-[#00000044]')}>
	<IconButton on:click>
		<TriangleRight size={30} />
	</IconButton>
</div>
