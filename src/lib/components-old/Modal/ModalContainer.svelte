<script lang="ts">
	import { fly } from 'svelte/transition';
</script>

<div
	class="max-w-3xl self-start mt-[10vh] bg-[#33333388] backdrop-blur-xl rounded overflow-hidden flex flex-col flex-1 mx-4 sm:mx-16 lg:mx-24 drop-shadow-xl"
	in:fly|global={{ y: 20, duration: 200, delay: 200 }}
	out:fly|global={{ y: 20, duration: 200 }}
>
	<slot />
</div>
