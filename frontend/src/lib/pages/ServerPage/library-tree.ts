import type { ServerLibraryEntryDto } from '$lib/apis/reiverr/reiverr.openapi';

export type LibraryOrder = 'size' | 'name';

export type LibraryNode = {
	entry: ServerLibraryEntryDto;
	name: string;
	depth: number;
	parent?: LibraryNode;
	/** As the server lists them; the rows are sorted */
	children: LibraryNode[];
	/** The totals of a directory are those of everything in it */
	size: number;
	files: number;
	/** A directory counts itself */
	directories: number;
	/** Files that requests hold, and how many requests that is */
	heldFiles: number;
	requests: number;
	/** Files the server knows, and among them the ones it may delete */
	indexedFiles: number;
	managedFiles: number;
};

export type LibraryTree = {
	roots: LibraryNode[];
	nodes: Map<string, LibraryNode>;
};

const parentPath = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf('/')));

/** The entries have to come with a directory before what is in it */
export function buildTree(entries: ServerLibraryEntryDto[]): LibraryTree {
	const roots: LibraryNode[] = [];
	const nodes = new Map<string, LibraryNode>();

	for (const entry of entries) {
		const parent = nodes.get(parentPath(entry.path));
		const requests = entry.requests ?? 0;
		const node: LibraryNode = {
			entry,
			name: entry.path.slice(entry.path.lastIndexOf('/') + 1),
			depth: parent ? parent.depth + 1 : 0,
			parent,
			children: [],
			size: entry.size,
			files: entry.isDirectory ? 0 : 1,
			directories: entry.isDirectory ? 1 : 0,
			heldFiles: requests > 0 ? 1 : 0,
			requests,
			indexedFiles: entry.mediaFileId ? 1 : 0,
			managedFiles: entry.managed ? 1 : 0
		};

		nodes.set(entry.path, node);
		(parent?.children ?? roots).push(node);
	}

	// What is in a directory comes after it, so backwards every total is complete when it is added
	const all = Array.from(nodes.values());
	for (let i = all.length - 1; i >= 0; i--) {
		const node = all[i];
		if (!node?.parent) continue;

		node.parent.size += node.size;
		node.parent.files += node.files;
		node.parent.directories += node.directories;
		node.parent.heldFiles += node.heldFiles;
		node.parent.requests += node.requests;
		node.parent.indexedFiles += node.indexedFiles;
		node.parent.managedFiles += node.managedFiles;
	}

	return { roots, nodes };
}

const byKind = (a: LibraryNode, b: LibraryNode) =>
	Number(b.entry.isDirectory) - Number(a.entry.isDirectory);
const byName = (a: LibraryNode, b: LibraryNode) =>
	a.name.localeCompare(b.name, undefined, { numeric: true });

/** Directories first in every order */
const compare: Record<LibraryOrder, (a: LibraryNode, b: LibraryNode) => number> = {
	size: (a, b) => byKind(a, b) || b.size - a.size || byName(a, b),
	name: (a, b) => byKind(a, b) || byName(a, b)
};

/** The rows of the tree: what is in a directory follows it when the directory is expanded */
export function getRows(
	roots: LibraryNode[],
	expanded: Set<string>,
	order: LibraryOrder
): LibraryNode[] {
	const rows: LibraryNode[] = [];
	const add = (nodes: LibraryNode[]) => {
		for (const node of [...nodes].sort(compare[order])) {
			rows.push(node);
			if (expanded.has(node.entry.path)) add(node.children);
		}
	};
	add(roots);

	return rows;
}

/** The node or the directory above it that is checked, which checks everything in it */
function getChecked(node: LibraryNode, checked: Set<string>): LibraryNode | undefined {
	for (let current: LibraryNode | undefined = node; current; current = current.parent) {
		if (checked.has(current.entry.path)) return current;
	}
}

export const isChecked = (node: LibraryNode, checked: Set<string>) => !!getChecked(node, checked);

/**
 * Checks a node, or unchecks it. Unchecking something in a checked directory unchecks the
 * directory and leaves everything else in it checked.
 */
export function toggleChecked(node: LibraryNode, checked: Set<string>): Set<string> {
	const next = new Set(checked);
	const checkedNode = getChecked(node, checked);

	if (!checkedNode) {
		// What is checked inside the node is now checked through it
		next.forEach((path) => {
			if (path.startsWith(`${node.entry.path}/`)) next.delete(path);
		});
		next.add(node.entry.path);

		return next;
	}

	next.delete(checkedNode.entry.path);
	for (let current = node; current !== checkedNode && current.parent; current = current.parent) {
		for (const sibling of current.parent.children) {
			if (sibling !== current) next.add(sibling.entry.path);
		}
	}

	return next;
}

/** The directories that have something checked in them */
export function getPartiallyChecked(checked: Set<string>): Set<string> {
	const partial = new Set<string>();
	checked.forEach((path) => {
		for (let parent = parentPath(path); parent; parent = parentPath(parent)) {
			partial.add(parent);
		}
	});

	return partial;
}

export function getSelection(checked: Set<string>, nodes: Map<string, LibraryNode>) {
	const selection = {
		files: 0,
		directories: 0,
		size: 0,
		heldFiles: 0,
		requests: 0,
		indexedFiles: 0,
		managedFiles: 0
	};
	checked.forEach((path) => {
		const node = nodes.get(path);
		if (!node) return;

		selection.files += node.files;
		selection.directories += node.directories;
		selection.size += node.size;
		selection.heldFiles += node.heldFiles;
		selection.requests += node.requests;
		selection.indexedFiles += node.indexedFiles;
		selection.managedFiles += node.managedFiles;
	});

	return selection;
}
