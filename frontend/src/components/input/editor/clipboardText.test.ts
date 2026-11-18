import {describe, expect, it} from 'vitest'
import {Schema} from '@tiptap/pm/model'
import type {Node as ProseMirrorNode} from '@tiptap/pm/model'

import {sliceToPlainText} from './clipboardText'

const schema = new Schema({
	nodes: {
		doc: {content: 'block+'},
		paragraph: {group: 'block', content: 'text*'},
		text: {group: 'inline'},
		bulletList: {group: 'block', content: 'listItem+'},
		orderedList: {group: 'block', content: 'listItem+', attrs: {start: {default: 1}}},
		listItem: {content: 'paragraph block*'},
	},
})

const p = (text: string) => schema.node('paragraph', null, text ? [schema.text(text)] : [])
const li = (...content: ProseMirrorNode[]) => schema.node('listItem', null, content)

function plainText(...blocks: ProseMirrorNode[]): string {
	const doc = schema.node('doc', null, blocks)
	return sliceToPlainText(doc.slice(0))
}

describe('sliceToPlainText', () => {
	it('separates paragraphs with blank lines like the default serializer', () => {
		expect(plainText(p('one'), p('two'))).toBe('one\n\ntwo')
	})

	it('keeps bullet markers for list items', () => {
		const list = schema.node('bulletList', null, [li(p('this')), li(p('is')), li(p('a')), li(p('list'))])
		expect(plainText(p('start'), list, p('end'))).toBe('start\n\n- this\n- is\n- a\n- list\n\nend')
	})

	it('numbers ordered list items from the list start', () => {
		const list = schema.node('orderedList', {start: 3}, [li(p('third')), li(p('fourth'))])
		expect(plainText(list)).toBe('3. third\n4. fourth')
	})

	it('indents continuation lines of a nested list under its marker', () => {
		const nested = schema.node('bulletList', null, [li(p('child'))])
		const list = schema.node('bulletList', null, [li(p('parent'), nested)])
		expect(plainText(list)).toBe('- parent\n  - child')
	})
})
