"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
    Bold, Italic, Strikethrough, Code, List, ListOrdered,
    Quote, Heading1, Heading2, Heading3, Undo, Redo,
    Link as LinkIcon, Image as ImageIcon, Minus, Loader2, Upload
} from "lucide-react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder = "Write your content here..." }: RichTextEditorProps) {
    const [linkUrl, setLinkUrl] = useState("")
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [showImageInput, setShowImageInput] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-600 underline hover:text-blue-800",
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "max-w-full rounded-lg my-4",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[400px] p-4",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    const setLink = useCallback(() => {
        if (!editor || !linkUrl) return

        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: linkUrl })
            .run()

        setLinkUrl("")
        setShowLinkInput(false)
    }, [editor, linkUrl])

    const uploadImageToS3 = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" })
            return null
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Maximum 5MB", variant: "destructive" })
            return null
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("folder", "banners")

            const response = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            })

            const result = await response.json()

            if (response.ok && result.url) {
                return result.url
            } else {
                throw new Error(result.message || "Upload failed")
            }
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" })
            return null
        } finally {
            setUploading(false)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !editor) return

        const imageUrl = await uploadImageToS3(file)
        if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run()
            toast({ title: "Image added", description: "Image uploaded and inserted" })
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
        setShowImageInput(false)
    }

    const addImageFromUrl = (url: string) => {
        if (!editor || !url) return
        editor.chain().focus().setImage({ src: url }).run()
        setShowImageInput(false)
    }

    if (!editor) {
        return (
            <div className="border rounded-lg p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Hidden file input for S3 upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Toolbar */}
            <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1 items-center">
                {/* Undo/Redo */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Headings */}
                <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 1 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 2 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 3 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    title="Heading 3"
                >
                    <Heading3 className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Text formatting */}
                <Toggle
                    size="sm"
                    pressed={editor.isActive("bold")}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("italic")}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("strike")}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("code")}
                    onPressedChange={() => editor.chain().focus().toggleCode().run()}
                    title="Inline Code"
                >
                    <Code className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Lists */}
                <Toggle
                    size="sm"
                    pressed={editor.isActive("bulletList")}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("orderedList")}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive("blockquote")}
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                    title="Blockquote"
                >
                    <Quote className="h-4 w-4" />
                </Toggle>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Link */}
                <Toggle
                    size="sm"
                    pressed={showLinkInput}
                    onPressedChange={() => {
                        setShowLinkInput(!showLinkInput)
                        setShowImageInput(false)
                    }}
                    title="Insert Link"
                >
                    <LinkIcon className="h-4 w-4" />
                </Toggle>

                {/* Image Upload */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Upload Image"
                >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>

                {/* Image URL */}
                <Toggle
                    size="sm"
                    pressed={showImageInput}
                    onPressedChange={() => {
                        setShowImageInput(!showImageInput)
                        setShowLinkInput(false)
                    }}
                    title="Insert Image URL"
                >
                    <ImageIcon className="h-4 w-4" />
                </Toggle>

                {/* Horizontal Rule */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Line"
                >
                    <Minus className="h-4 w-4" />
                </Button>
            </div>

            {/* Link Input */}
            {showLinkInput && (
                <div className="bg-gray-50 border-b p-2 flex gap-2">
                    <Input
                        type="url"
                        placeholder="Enter link URL..."
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => e.key === "Enter" && setLink()}
                    />
                    <Button type="button" size="sm" onClick={setLink}>
                        Add Link
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowLinkInput(false)}>
                        Cancel
                    </Button>
                </div>
            )}

            {/* Image URL Input */}
            {showImageInput && (
                <div className="bg-gray-50 border-b p-2 flex gap-2">
                    <Input
                        type="url"
                        placeholder="Enter image URL..."
                        className="flex-1"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                addImageFromUrl((e.target as HTMLInputElement).value)
                            }
                        }}
                    />
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                            const input = document.querySelector('input[placeholder="Enter image URL..."]') as HTMLInputElement
                            addImageFromUrl(input?.value || "")
                        }}
                    >
                        Add Image
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowImageInput(false)}>
                        Cancel
                    </Button>
                </div>
            )}

            {/* Editor Content */}
            <EditorContent editor={editor} className="bg-white" />

            {/* Word Count */}
            <div className="bg-gray-50 border-t p-2 text-xs text-gray-500 flex justify-between">
                <span>
                    {editor.storage.characterCount?.words?.() ||
                        editor.getText().split(/\s+/).filter(Boolean).length} words
                </span>
                <span>
                    {Math.ceil((editor.getText().split(/\s+/).filter(Boolean).length || 0) / 200)} min read
                </span>
            </div>
        </div>
    )
}

export default RichTextEditor
