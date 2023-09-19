<div class="w-full flex items-center px-5 gap-3">
	<media-time type="current" class="text-zinc-400 text-sm font-fira" />
	<media-time-slider
		class="group mx-1 flex h-12 items-center flex-1"
		track-class="absolute top-1/2 left-0 z-0 h-0.5 w-full -translate-y-1/2 bg-zinc-200/25 outline-none group-data-[focus]:ring-4 group-data-[focus]:ring-yellow-600"
		track-fill-class="absolute top-1/2 left-0 z-20 h-0.5 w-[var(--slider-fill-percent)] -translate-y-1/2 bg-amber-400/80 will-change-[width]"
		track-progress-class="absolute top-1/2 left-0 z-10 h-0.5 w-[var(--media-buffered-percent)] -translate-y-1/2 bg-zinc-400/60 will-change-[width]"
		thumb-container-class="absolute top-0 left-[var(--slider-fill-percent)] z-20 h-full w-3 -translate-x-1/2 group-data-[dragging]:left-[var(--slider-pointer-percent)] items-center"
		thumb-class="absolute top-1/2 left-0 h-2.5 w-3 -translate-y-1/2 rounded-full bg-amber-400 opacity-0 transition-opacity duration-150 ease-in group-data-[interactive]:opacity-100"
		chapters-class="relative flex items-center w-full h-full"
		chapter-container-class="flex items-center w-[var(--width)] h-full mr-0.5 last:mr-0"
		chapter-class="relative flex items-center w-full h-1"
	/>
	<media-time type="duration" class="text-zinc-400 text-sm font-fira" />
</div>
