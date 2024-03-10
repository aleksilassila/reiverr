<div
	class="opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-hover:ease-in font-fira"
>
	<media-volume-slider
		class="group my-2.5 flex h-10 w-20 items-center"
		track-class="absolute bottom-0 left-0 z-0 h-0.5 w-20 bg-amber-400/20 outline-none group-data-[focus]:ring-4 group-data-[focus]:ring-amber-600"
		track-fill-class="absolute bottom-0 z-20 w-[var(--slider-fill-percent)] h-0.5 bg-zinc-200 will-change-[width]"
		thumb-container-class="absolute z-20 w-full h-10 group-data-[dragging]:bottom-[var(--slider-pointer-percent)]"
		thumb-class="absolute bottom-0 left-1/2 h-2.5 w-2.5 rounded-full bg-yellow-400 opacity-0 transition-opacity duration-150 ease-in group-data-[interactive]:opacity-100"
	>
		<div
			class="absolute flex items-center justify-center rounded-sm px-1 py-px text-white/80 opacity-0 transition-opacity duration-200 ease-out group-data-[interactive]:opacity-100 group-data-[interactive]:ease-in"
			slot="preview"
		>
			<media-slider-value
				type="pointer"
				format="percent"
				class="bg-zinc-800 text-zinc-300 rounded-md font-medium"
			/>
		</div>
	</media-volume-slider>
</div>
