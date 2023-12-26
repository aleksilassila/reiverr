<script lang="ts">
  import Carousel from "./lib/components/Carousel/Carousel.svelte";
  import I18n from "./lib/components/Lang/I18n.svelte";
  import { _ } from "svelte-i18n";
  import CarouselPlaceholderItems from "./lib/components/Carousel/CarouselPlaceholderItems.svelte";
  import { Link, navigate, Route, Router } from "svelte-navigator";
  import { fade } from "svelte/transition";
  import { networks } from "./lib/discover";
  import NetworkCard from "./lib/components/NetworkCard.svelte";

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") {
      console.log("right");
      navigate("/about");
    }
    if (event.key === "ArrowLeft") {
      console.log("left");
      navigate("/");
    }
  }
</script>

<I18n />
<main class="bg-stone-950 text-white">
  <Router>
    <nav>
      <Link to="/">Home</Link>
      <Link to="about">About</Link>
    </nav>

    <Carousel>
      <div slot="title" class="text-lg font-semibold text-zinc-300">
        {$_("discover.upcomingSeries")}
      </div>
      <CarouselPlaceholderItems />
    </Carousel>

    <Carousel>
      <div slot="title" class="text-lg font-semibold text-zinc-300">
        {$_("discover.TVNetworks")}
      </div>
      {#each Object.values(networks) as network (network.tmdbNetworkId)}
        <NetworkCard {network} />
      {/each}
    </Carousel>

    <Route path="/">
      <div transition:fade|global>Home path</div>
    </Route>
    <Route path="about">
      <div transition:fade|global>about path</div>
    </Route>
  </Router>
</main>

<svelte:window on:keydown={handleKeyDown} />
