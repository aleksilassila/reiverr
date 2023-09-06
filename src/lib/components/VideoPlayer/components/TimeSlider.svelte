<div class="w-full flex items-center px-5 gap-5">
    <media-time type="current" class="text-zinc-400 font-bold text-base" />
    <media-time-slider
        class="group mx-1 flex h-12 items-center flex-1"
        track-class="absolute top-1/2 left-0 z-0 h-1 w-full -translate-y-1/2 bg-zinc-200/25 outline-none group-data-[focus]:ring-4 group-data-[focus]:ring-yellow-600"
        track-fill-class="absolute top-1/2 left-0 z-20 h-1 w-[var(--slider-fill-percent)] -translate-y-1/2 bg-amber-400 will-change-[width]"
        thumb-container-class="absolute top-0 left-[var(--slider-fill-percent)] z-20 h-full w-5 -translate-x-1/2 group-data-[dragging]:left-[var(--slider-pointer-percent)] items-center"
        thumb-class="absolute top-1/2 left-0 h-2.5 w-3 -translate-y-1/2 rounded-full bg-amber-400 opacity-0 transition-opacity duration-150 ease-in group-data-[interactive]:opacity-100"
    />
    <media-time type="duration" class="text-zinc-400 font-bold text-base" />
</div>