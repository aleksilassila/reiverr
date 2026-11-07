<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import classNames from 'classnames';
	import Card from '../Card/Card.svelte';
	import type { Network } from './collections';
	import { navigate } from '../StackRouter/stack-router.store';

	interface Props {
		onEnter?: ComponentProps<typeof Card>['onEnter'];
		network: Network;
	}

	let { network, onEnter }: Props = $props();
</script>

<Card
	orientation="landscape"
	class="bg-primary-800"
	onClickOrSelect={() => navigate(`/network/${network.route}`)}
	{onEnter}
>
	<div
		class={classNames(
			'absolute inset-10 bg-secondary-200 group-hover:bg-primary-200 transition-colors m-6'
		)}
		style={"mask-image: url('/networks/" +
			network.route +
			".svg'); mask-size: contain; mask-repeat: no-repeat; mask-position: center;"}
	></div>
</Card>
