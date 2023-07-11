<script lang="ts">
	import classNames from 'classnames';
</script>

<div class={classNames($$restProps.class, 'overflow-x-scroll scrollbar-hide')}>
	<slot />
</div>
