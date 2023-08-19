<script>
	export let checked = false;
</script>

<label class="relative inline-flex items-center cursor-pointer w-min h-min">
	<input type="checkbox" bind:checked class="sr-only peer" />
	<div
		class="w-11 h-6 rounded-full peer bg-zinc-600 bg-opacity-20 peer-checked:bg-amber-200 peer-checked:bg-opacity-30 peer-selectable
        after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px]"
	/>
</label>
