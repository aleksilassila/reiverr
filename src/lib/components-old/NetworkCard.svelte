<script lang="ts">
	import type { Network } from '$lib/discover';

	export let network: Network;
</script>

<a
	href={`/discover/network/${network.name}`}
	class="block border rounded-xl h-52 w-96 bg-zinc-900 border-stone-700 cursor-pointer p-12 text-zinc-300 hover:text-amber-200 transition-all relative group selectable flex-shrink-0 max-w-[100%]"
>
	<div
		class="absolute inset-10 bg-zinc-300 sm:hover:bg-amber-200 sm:group-hover:scale-105 transition-all"
		style={"mask-image: url('/networks/" +
			network.name +
			".svg'); mask-size: contain; mask-repeat: no-repeat; mask-position: center;"}
	/>
</a>
