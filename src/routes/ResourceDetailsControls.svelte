<script lang="ts">
	import { ChevronDown, ChevronLeft, ChevronRight, DotFilled } from 'radix-icons-svelte';
</script>

<div class="relative z-[1] flex gap-8 justify-between items-center col-span-2">
	<div class="p-4 cursor-pointer text-zinc-200 hover:text-zinc-100">
		<ChevronLeft size="24" />
	</div>
	<div class="flex gap-2">
		<DotFilled size="15" />
		<DotFilled size="15" class="opacity-20" />
		<DotFilled size="15" class="opacity-20" />
		<DotFilled size="15" class="opacity-20" />
		<DotFilled size="15" class="opacity-20" />
	</div>

	<div class="p-4 cursor-pointer text-zinc-200 hover:text-zinc-100">
		<ChevronRight size="24" />
	</div>
</div>
<!--<div class="absolute inset-x-0 bottom-6 flex justify-center mx-auto opacity-50">-->
<!--	<ChevronDown size="20" />-->
<!--</div>-->
