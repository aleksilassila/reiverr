import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { useSimpleModal } from './modal.store';
import ModalStackProvider from './ModalStackProvider.svelte';
import PickModal from './PickModal.fixture.svelte';

it('keeps the props of a modal that has closed itself', async () => {
	const modalStack = useSimpleModal();
	const onPick = vi.fn();
	render(ModalStackProvider, { modalStack });

	modalStack.createModal(PickModal, { options: ['English', 'Finnish'], onPick });
	await tick();
	screen.getByText('Finnish').click();
	await tick();

	expect(onPick).toHaveBeenCalledWith('Finnish');
	expect(screen.queryByText('Finnish')).toBeNull();
});

it('replaces an open modal with the next one', async () => {
	const modalStack = useSimpleModal();
	render(ModalStackProvider, { modalStack });

	modalStack.createModal(PickModal, { options: ['English'], onPick: () => {} });
	await tick();
	modalStack.createModal(PickModal, { options: ['Stereo'], onPick: () => {} });
	await tick();

	expect(screen.queryByText('English')).toBeNull();
	expect(screen.getByText('Stereo')).toBeTruthy();
});
