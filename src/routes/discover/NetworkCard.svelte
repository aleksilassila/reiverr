<script>
	export let href;
</script>

<a
	{href}
	class="border rounded-xl h-52 w-96 bg-stone-900 border-stone-700 flex items-center justify-center cursor-pointer hover:scale-[103%] p-12 text-zinc-300 hover:text-amber-200 transition-all"
>
	<slot />
</a>
