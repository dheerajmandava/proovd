'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { EditorContent, useEditor, BubbleMenu, Editor } from '@tiptap/react'; // Added Editor type
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { SketchPicker, ColorResult } from 'react-color'; // Import SketchPicker & ColorResult
import { 
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, 
  List, ListOrdered, Quote, MinusSquare, Link, 
  Highlighter, Palette, Check, AlignLeft, AlignCenter, AlignRight,
  X // Import X icon for close
} from 'lucide-react';

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  inlineEditing?: boolean;
  onEditorReady?: (editor: Editor | null) => void; // Corrected type
  readOnly?: boolean;
}

export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
  inlineEditing = false,
  onEditorReady,
  readOnly = false
}: RichTextEditorProps) {
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentHighlight, setCurrentHighlight] = useState('#FFFF00');
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true })
    ],
    content: content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none ${
          inlineEditing ? 'p-0' : 'p-3'
        }`,
      },
    },
    // Directly pass placeholder to Tiptap's placeholder extension
    // placeholder: placeholder, // Placeholder extension handles this
  });

  // Set up editor once it's available
  useEffect(() => {
    if (editor) {
      onEditorReady?.(editor);
      // Update content if it changes externally
      if (content !== editor.getHTML()) {
        editor.commands.setContent(content || '', false); // Avoid triggering onUpdate
      }
    }
  }, [editor, onEditorReady]); // Only depend on editor and callback

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);
  
  // Handle theme changes and initial client-side render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Update current colors when selection changes
  useEffect(() => {
    if (editor) {
      const updateCurrentColors = () => {
        setCurrentColor(editor.getAttributes('textStyle').color || '#000000');
        setCurrentHighlight(editor.getAttributes('highlight').color || '#FFFF00');
      };
      editor.on('selectionUpdate', updateCurrentColors);
      editor.on('transaction', updateCurrentColors); // Update after commands too
      return () => {
        editor.off('selectionUpdate', updateCurrentColors);
        editor.off('transaction', updateCurrentColors);
      };
    }
  }, [editor]);
  
  if (!isMounted) {
    return (
      <div 
        className="bg-base-200/50 animate-pulse rounded"
        style={{ minHeight }}
      ></div>
    );
  }

  const isDark = theme === 'dark';
  
  if (readOnly) {
    return (
      <div className="rich-text-content prose dark:prose-invert max-w-none">
        <EditorContent editor={editor} />
      </div>
    );
  }

  const MenuButton = ({ 
    onClick, 
    active = false, 
    disabled = false,
    title,
    children 
  }: { 
    onClick: () => void, 
    active?: boolean, 
    disabled?: boolean,
    title: string,
    children: React.ReactNode 
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors ${
        active 
          ? 'bg-primary/10 text-primary hover:bg-primary/20' 
          : 'hover:bg-base-300 text-base-content/80 hover:text-base-content'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={title}
    >
      {children}
    </button>
  );

  const handleColorChange = (color: ColorResult) => {
    setCurrentColor(color.hex);
    editor?.chain().focus().setColor(color.hex).run();
  };

  const handleHighlightChange = (color: ColorResult) => {
    setCurrentHighlight(color.hex);
    editor?.chain().focus().toggleHighlight({ color: color.hex }).run();
  };

  return (
    <div className={`rich-text-editor border ${
      inlineEditing 
        ? 'border-none shadow-none' 
        : isDark 
          ? 'border-gray-700 bg-gray-800 shadow-md' 
          : 'border-gray-200 bg-white shadow-sm'
    } rounded-lg overflow-hidden relative`}> 
      
      {/* Bubble Menu for Inline Editing (only if inlineEditing is true) */} 
      {inlineEditing && editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }} 
          className={`bg-base-100 shadow-lg rounded-md border border-base-300 p-1 flex gap-0.5 ${
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </MenuButton>
          {/* Add color/highlight buttons if desired for bubble menu */} 
        </BubbleMenu>
      )}
      
      {/* Static Toolbar for Non-Inline Editing (Simplified for Style Panel) */} 
      {!inlineEditing && editor && (
        <div className={`flex flex-wrap gap-0.5 p-1.5 ${
          isDark ? 'border-b border-gray-700 bg-gray-900/50' : 'border-b border-gray-200 bg-gray-50'
        }`}>
          {/* --- Simplified Toolbar Buttons --- */}
          <div className="flex items-center space-x-0.5 mr-1">
            <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={16} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={16} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={16} /></MenuButton>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 my-auto" />
          {/* --- Color/Highlight Pickers --- */}
          <div className="relative flex items-center">
            <MenuButton onClick={() => setColorPickerOpen(!colorPickerOpen)} title="Text Color" active={colorPickerOpen}>
              <Palette size={16} style={{ color: editor.getAttributes('textStyle').color || 'inherit' }} />
            </MenuButton>
            {colorPickerOpen && (
              <div 
                className="absolute right-0 mt-1 p-2 bg-base-100 rounded-md shadow-lg z-20 border border-base-300"
                style={{ top: 'calc(100% + 4px)' }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex justify-end mb-1">
                  <button onClick={() => setColorPickerOpen(false)} className="text-xs text-base-content/60 hover:text-error"><X size={14}/></button>
                </div>
                <SketchPicker 
                  color={currentColor} 
                  onChangeComplete={handleColorChange}
                  presetColors={[]}
                  styles={{
                    default: {
                      picker: { boxShadow: 'none', padding: '0', border: 'none', width: '200px' },
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className="relative flex items-center">
            <MenuButton onClick={() => setHighlightPickerOpen(!highlightPickerOpen)} title="Highlight Text" active={highlightPickerOpen}>
              <Highlighter size={16} style={{ color: editor.getAttributes('highlight').color || 'inherit' }}/>
            </MenuButton>
            {highlightPickerOpen && (
              <div 
                className="absolute right-0 mt-1 p-2 bg-base-100 rounded-md shadow-lg z-20 border border-base-300"
                style={{ top: 'calc(100% + 4px)' }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex justify-between items-center mb-1">
                  <button 
                    onClick={() => { 
                      editor?.chain().focus().unsetHighlight().run(); 
                      setHighlightPickerOpen(false);
                    }} 
                    className="btn btn-xs btn-ghost text-error"
                    title="Remove Highlight"
                  >
                    Remove
                  </button>
                  <button onClick={() => setHighlightPickerOpen(false)} className="text-xs text-base-content/60 hover:text-error"><X size={14}/></button>
                </div>
                <SketchPicker 
                  color={currentHighlight} 
                  onChangeComplete={handleHighlightChange}
                  presetColors={['#FFFF00', '#FFCCE0', '#FFD6A5', '#FFFFA8', '#CBFFAD', '#A5DFFF', '#CAD9FF', '#F4CCFF', '#FFC2C2']}
                  styles={{
                    default: {
                      picker: { boxShadow: 'none', padding: '0', border: 'none', width: '200px' },
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      <EditorContent 
        editor={editor}
        className={`overflow-y-auto ${inlineEditing ? '' : 'min-h-[120px]'}`}
        style={{ minHeight: inlineEditing ? 'auto' : minHeight }}
      />
      
      {!inlineEditing && (
        <div className={`text-xs px-3 py-1.5 text-right ${
          isDark ? 'text-gray-400 bg-gray-900/30' : 'text-gray-500 bg-gray-50'
        }`}>
          {/* Hint text can be added here if needed */}
        </div>
      )}
    </div>
  );
} 