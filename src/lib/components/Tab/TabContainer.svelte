<script lang="ts">
	import classNames from 'classnames';
	import Container from '../Container.svelte';
</script>

<Container class={classNames('w-full h-full relative', $$restProps.class)}>
	<slot />
</Container>
