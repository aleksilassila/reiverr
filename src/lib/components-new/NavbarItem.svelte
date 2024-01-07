<script lang="ts">
	import Selectable from '../components/Selectable.svelte';
	import classNames from 'classnames';
	import { useNavigate } from 'svelte-navigator';
	import { get } from 'svelte/store';
	import { Container } from '../actions/focusAction';

	export let to: string;
	export let parentContainer: Container;
	const { container, hasFocus } = parentContainer.createChild('navBarItem').getStores();

	const navigate = useNavigate();

	function handleClick() {
		navigate(to);
		get(Container.focusedObject)?.giveFocus('right');
	}
</script>

<button on:click={handleClick}>
	<Selectable {container}>
		<div
			class={classNames('flex items-center my-2', {
				'text-amber-200': $hasFocus
			})}
		>
			<slot name="icon" />
			<slot name="text" />
		</div>
	</Selectable>
</button>
