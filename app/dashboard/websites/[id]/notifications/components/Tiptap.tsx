'use client'

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
export default function Tiptap({ value, onChange }: { value: string, onChange: (value: string) => void }) {
    const editor = useEditor({
        extensions: [StarterKit, Bold],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getText();
            editor.commands.setContent(html);
            onChange(html);
        },
        immediatelyRender: false,
    })

    return <EditorContent editor={editor} />
}

