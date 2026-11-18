import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

/**
 * Plain-text form of a copied editor selection. ProseMirror's default serializer
 * joins the text of every block and drops the list structure, so a copied bullet
 * list would paste as bare lines. This keeps the markers as markdown does
 * ("- " for bullets, "1. " for ordered items), so the text still reads as a list.
 */
export function sliceToPlainText(slice: Slice): string {
	return renderBlocks(slice.content, '\n\n')
}

function renderBlocks(fragment: Fragment, separator: string): string {
	const parts: string[] = []
	fragment.forEach(node => {
		const text = renderNode(node)
		if (text !== '') {
			parts.push(text)
		}
	})
	return parts.join(separator)
}

function renderNode(node: ProseMirrorNode): string {
	if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
		const ordered = node.type.name === 'orderedList'
		const start = ordered ? Number(node.attrs.start ?? 1) : 1
		const items: string[] = []
		node.forEach((item, _offset, index) => {
			const marker = ordered ? `${start + index}. ` : '- '
			const body = renderBlocks(item.content, '\n')
			// Continuation lines of a multi-line item are indented under its marker.
			const indented = body.split('\n').map((line, i) => (i === 0 ? marker + line : ' '.repeat(marker.length) + line))
			items.push(indented.join('\n'))
		})
		return items.join('\n')
	}

	if (node.isTextblock) {
		return node.textContent
	}

	if (node.content.size > 0) {
		return renderBlocks(node.content, '\n\n')
	}

	return ''
}
