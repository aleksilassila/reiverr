<script lang="ts">
	import classNames from 'classnames';
	import { useNavigate } from 'svelte-navigator';
	import { type Readable } from 'svelte/store';
	import Container from '../../../Container.svelte';

	export let to: string;
	let hasFocus: Readable<boolean>;

	const navigate = useNavigate();

	function handleClick() {
		navigate(to);
	}
</script>

<Container tag="button" on:click={handleClick} bind:hasFocus>
	<div
		class={classNames('flex items-center my-2', {
			'text-amber-200': $hasFocus
		})}
	>
		<slot name="icon" />
		<slot name="text" />
	</div>
</Container>
