<script lang="ts">
	import { formatSize } from '$lib/utils.js';
</script>

<div class="bg-highlight-dim relative w-full m-auto p-3 px-4 rounded-xl overflow-hidden">
	<div class="absolute left-0 inset-y-0 w-[70%] bg-[#ffffff22]" />
	<div class="relative z-[1] flex justify-between items-center">
		<div class="flex flex-col">
			<h3 class="text-zinc-400 font-medium text-xs tracking-wider">Mac-Mini</h3>
			<a href="/" class="text-zinc-200 font-bold text-xl tracking-wide">Sonarr</a>
		</div>
		<div class="flex gap-8">
			<div class="flex flex-col items-center gap-0.5">
				<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Movies</h3>
				<div class="font-medium text-sm">30</div>
			</div>
			<div class="flex flex-col items-center gap-0.5">
				<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Space Taken</h3>
				<div class="font-medium text-sm">{formatSize(120_000_000_000)}</div>
			</div>
			<div class="flex flex-col items-center gap-0.5">
				<h3 class="uppercase text-zinc-400 font-medium text-xs tracking-wider">Space Left</h3>
				<div class="font-medium text-sm">{formatSize(50_000_000_000)}</div>
			</div>
		</div>
	</div>
</div>
