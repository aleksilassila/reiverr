<script lang="ts">
    export let min = 0;
    export let max = 100;
    export let step = 0.01;
    export let primaryValue = 0;
    export let secondaryValue = 0;

    let progressBarOffset = 0;
</script>

<div class="h-2 relative group">
    <!-- 0.54 em is half the width of the input thumb size -->
    <div class="h-full relative px-[0.54em]">
        <div class="h-full bg-gray-300 rounded-full overflow-hidden relative">
            <!-- Secondary progress -->
            <div class="h-full bg-gray-400 absolute top-0" 
                style="width: {secondaryValue / max * 100}%;">
            </div>

            <!-- Primary progress -->
            <div class="h-full bg-amber-200 absolute top-0" 
                style="width: {primaryValue / max * 100}%;"
                bind:offsetWidth={progressBarOffset}>
            </div>
        </div>

        <div class="absolute w-4 h-4 bg-amber-200 rounded-full transform mx-2 -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-pointer
                    drop-shadow-md group-hover:scale-125 group-hover:shadow-lg transition-transform duration-100"
            style="left: {progressBarOffset}px;"
        ></div>
    </div>

    <input
        type="range"
        class="w-full h-full absolute cursor-pointer opacity-0 transform -translate-y-2"
        min={min} max={max} step={step} bind:value={primaryValue} on:mouseup on:mousedown
        on:touchstart on:touchend
    />
</div>