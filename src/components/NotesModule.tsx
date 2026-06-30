import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Note, Attachment } from '../types';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  Eye, 
  Tag as TagIcon, 
  FolderOpen,
  X,
  FileText,
  Download,
  Mic,
  MicOff,
  Sparkles,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  CloudLightning,
  Check,
  RotateCcw,
  ArrowLeft,
  Save,
  Clock,
  Paperclip,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../lib/firebase';

// Helper: Escape HTML string
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Robust HTML to Markdown conversion
function htmlToMarkdown(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const convertNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    
    let childrenContent = '';
    element.childNodes.forEach(child => {
      childrenContent += convertNode(child);
    });
    
    switch (tagName) {
      case 'h1': return `\n# ${childrenContent}\n`;
      case 'h2': return `\n## ${childrenContent}\n`;
      case 'h3': return `\n### ${childrenContent}\n`;
      case 'h4': return `\n#### ${childrenContent}\n`;
      case 'h5': return `\n##### ${childrenContent}\n`;
      case 'h6': return `\n###### ${childrenContent}\n`;
      case 'strong':
      case 'b': return `**${childrenContent}**`;
      case 'em':
      case 'i': return `*${childrenContent}*`;
      case 'u': return `<u>${childrenContent}</u>`;
      case 'del':
      case 'strike':
      case 's': return `~~${childrenContent}~~`;
      case 'blockquote': return `\n> ${childrenContent.trim().replace(/\n/g, '\n> ')}\n`;
      case 'pre': {
        const codeElement = element.querySelector('code');
        const codeText = codeElement ? codeElement.innerText : element.innerText;
        return `\n\`\`\`\n${codeText.trim()}\n\`\`\`\n`;
      }
      case 'code': return `\`${childrenContent}\``;
      case 'hr': return `\n---\n`;
      case 'a': {
        const href = element.getAttribute('href') || '';
        return `[${childrenContent}](${href})`;
      }
      case 'img': {
        const src = element.getAttribute('src') || '';
        const alt = element.getAttribute('alt') || 'Image';
        return `![${alt}](${src})`;
      }
      case 'li': {
        const checkbox = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox) {
          const isChecked = checkbox.checked || element.innerHTML.includes('checked');
          const cleanText = childrenContent.replace(/\[\s?x?\]/gi, '').trim();
          return `- [${isChecked ? 'x' : ' '}] ${cleanText}`;
        }
        return `- ${childrenContent}`;
      }
      case 'ul': return `\n${childrenContent}\n`;
      case 'ol': {
        let itemsMarkdown = '';
        let index = 1;
        element.querySelectorAll(':scope > li').forEach(li => {
          let liContent = '';
          li.childNodes.forEach(child => {
            if (child.nodeName !== 'INPUT') {
              liContent += convertNode(child);
            }
          });
          itemsMarkdown += `${index++}. ${liContent.trim()}\n`;
        });
        return `\n${itemsMarkdown}\n`;
      }
      case 'p':
      case 'div': {
        const align = element.style.textAlign || element.getAttribute('align') || '';
        const color = element.style.color || '';
        const bg = element.style.backgroundColor || '';
        
        let prefix = '';
        let suffix = '';
        if (align) {
          prefix = `<div align="${align}">`;
          suffix = '</div>';
        }
        if (color) {
          prefix += `<span style="color:${color}">`;
          suffix = '</span>' + suffix;
        }
        if (bg) {
          prefix += `<span style="background-color:${bg}">`;
          suffix = '</span>' + suffix;
        }
        
        return `\n${prefix}${childrenContent}${suffix}\n`;
      }
      case 'span': {
        const color = element.style.color || '';
        const bg = element.style.backgroundColor || '';
        if (color || bg) {
          let style = '';
          if (color) style += `color:${color};`;
          if (bg) style += `background-color:${bg};`;
          return `<span style="${style}">${childrenContent}</span>`;
        }
        return childrenContent;
      }
      case 'br': return '\n';
      default: return childrenContent;
    }
  };
  
  let markdown = '';
  tempDiv.childNodes.forEach(node => {
    markdown += convertNode(node);
  });
  
  return markdown.replace(/\n{3,}/g, '\n\n').trim();
}

// Robust Markdown to HTML conversion
function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;

  // Code Blocks
  const codeBlocks: string[] = [];
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
    codeBlocks.push(`<pre class="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl font-mono text-xs overflow-x-auto my-3 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800"><code>${escapeHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  // Inline Code
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `__INLINE_CODE_PLACEHOLDER_${inlineCodes.length}__`;
    inlineCodes.push(`<code class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono text-xs text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800">${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // Headings
  html = html.replace(/^# (.*)$/gm, '<h1 class="text-3xl font-extrabold tracking-tight mt-6 mb-3 text-slate-900 dark:text-white font-display">$1</h1>');
  html = html.replace(/^## (.*)$/gm, '<h2 class="text-2xl font-bold mt-5 mb-2.5 text-slate-800 dark:text-slate-100 font-display">$1</h2>');
  html = html.replace(/^### (.*)$/gm, '<h3 class="text-xl font-bold mt-4 mb-2 text-slate-800 dark:text-slate-200 font-display">$1</h3>');
  html = html.replace(/^#### (.*)$/gm, '<h4 class="text-lg font-bold mt-3.5 mb-2 text-slate-800 dark:text-slate-200">$1</h4>');
  html = html.replace(/^##### (.*)$/gm, '<h5 class="text-base font-bold mt-3 mb-1.5 text-slate-800 dark:text-slate-300">$1</h5>');
  html = html.replace(/^###### (.*)$/gm, '<h6 class="text-sm font-bold mt-2.5 mb-1 text-slate-800 dark:text-slate-400">$1</h6>');

  // Horizontal line
  html = html.replace(/^---$/gm, '<hr class="border-slate-200 dark:border-slate-800 my-6" />');

  // Blockquotes
  html = html.replace(/^> (.*)$/gm, '<blockquote class="border-l-4 border-indigo-500 pl-4 py-1.5 my-3 italic text-slate-600 dark:text-slate-400">$1</blockquote>');

  // Checklist items
  html = html.replace(/^- \[x\] (.*)$/gim, '<li class="flex items-center gap-2 list-none my-1"><input type="checkbox" checked class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" onclick="return false;" /> <span class="line-through text-slate-400 dark:text-slate-500">$1</span></li>');
  html = html.replace(/^- \[\s?\] (.*)$/gim, '<li class="flex items-center gap-2 list-none my-1"><input type="checkbox" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" onclick="return false;" /> <span>$1</span></li>');

  // Bullet items
  html = html.replace(/^- (.*)$/gm, '<li class="list-disc ml-5 my-1">$1</li>');

  // Images and links
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" referrerPolicy="no-referrer" class="max-w-full h-auto rounded-2xl shadow-lg my-4 border border-slate-100 dark:border-slate-800" />');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 underline font-medium hover:text-indigo-500">$1</a>');

  // Basic styling
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Group list items
  let insideList = false;
  const lines = html.split('\n');
  const groupedLines: string[] = [];
  
  for (let line of lines) {
    const isLi = line.startsWith('<li');
    if (isLi && !insideList) {
      insideList = true;
      groupedLines.push('<ul class="space-y-1.5 my-3">');
    } else if (!isLi && insideList) {
      insideList = false;
      groupedLines.push('</ul>');
    }
    groupedLines.push(line);
  }
  if (insideList) {
    groupedLines.push('</ul>');
  }
  html = groupedLines.join('\n');

  // Restore Code Blocks
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_PLACEHOLDER_${index}__`, block);
  });
  inlineCodes.forEach((block, index) => {
    html = html.replace(`__INLINE_CODE_PLACEHOLDER_${index}__`, block);
  });

  // Paragraph tags
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<pre') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<hr') || p.trim().startsWith('<div') || p.trim().startsWith('<p') || p.trim().startsWith('<li')) {
      return p;
    }
    if (p.trim() === '') return '';
    return `<p class="my-2 leading-relaxed text-slate-700 dark:text-slate-300">${p}</p>`;
  }).join('\n\n');

  return html;
}

export const NotesModule: React.FC = () => {
  const { 
    notes, 
    addNote, 
    updateNote, 
    deleteNote, 
    profile,
    selectedNoteId,
    setSelectedNoteId,
    isNoteEditing: isEditing,
    setIsNoteEditing: setIsEditing
  } = useApp();
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Link Dialog states
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Synchronize first note selection if none is active
  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [selectedNoteId, notes, setSelectedNoteId]);
  
  // Editor View Mode: 'markdown' | 'preview'
  const [editorMode, setEditorMode] = useState<'markdown' | 'preview'>('markdown');

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState(''); // Store content as Markdown in DB
  const [formCategory, setFormCategory] = useState('Work');
  const [formTagsStr, setFormTagsStr] = useState('');
  const [formAttachments, setFormAttachments] = useState<Attachment[]>([]);

  // Manual save status notice
  const [showSaveNotice, setShowSaveNotice] = useState(false);

  // Auto-save & Status indicators
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const currentContentRef = useRef<string>(''); // tracks live markdown content

  const formStateRef = useRef({
    title: '',
    content: '',
    category: 'Work',
    tagsStr: '',
    attachments: [] as Attachment[]
  });

  const categories = ['Work', 'Personal', 'Ideas', 'Reflections', 'Reference'];
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // Synchronize component states when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setFormTitle(selectedNote.title);
      setFormContent(selectedNote.content);
      setFormCategory(selectedNote.category);
      setFormTagsStr(selectedNote.tags.join(', '));
      setFormAttachments(selectedNote.attachments || []);
      currentContentRef.current = selectedNote.content;
      
      formStateRef.current = {
        title: selectedNote.title,
        content: selectedNote.content,
        category: selectedNote.category,
        tagsStr: selectedNote.tags.join(', '),
        attachments: selectedNote.attachments || []
      };
    }
  }, [selectedNoteId, selectedNote]);

  // Focus the editor immediately after opening
  useEffect(() => {
    if (isEditing && editorMode === 'markdown') {
      const focusAndEnd = () => {
        const textarea = document.getElementById('note-markdown-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          try {
            const length = textarea.value.length;
            textarea.setSelectionRange(length, length);
          } catch (e) {
            console.warn("Could not place cursor at end:", e);
          }
        }
      };
      
      // Delay slightly to allow transition and DOM render
      const timer = setTimeout(focusAndEnd, 150);
      return () => clearTimeout(timer);
    }
  }, [isEditing, editorMode]);

  // Auto-save logic
  const triggerAutoSave = () => {
    if (!selectedNote) return;
    setSaveStatus('dirty');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      const { title, content, category, tagsStr, attachments } = formStateRef.current;
      const tagsArray = tagsStr
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      updateNote({
        ...selectedNote,
        title,
        content,
        category,
        tags: tagsArray,
        attachments,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus('saved');
    }, 1500);
  };

  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Filter notes for List view
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || note.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Notes sorting (pinned first, then chronological updated)
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Handle Note card clicks
  const handleSelectNote = (note: Note) => {
    // Flush current draft before switching
    if (isEditing && selectedNote && saveStatus === 'dirty') {
      handleManualSave();
    }
    setSelectedNoteId(note.id);
    setIsEditing(true);
    setEditorMode('markdown');
    setSaveStatus('saved');
  };

  // Create new note
  const handleStartCreate = async () => {
    const newNoteId = await addNote({
      title: 'Untitled Document',
      content: '## New Document\nType notes here...',
      category: 'Work',
      isPinned: false,
      tags: ['draft']
    });
    
    if (newNoteId) {
      setSelectedNoteId(newNoteId);
      setFormTitle('Untitled Document');
      setFormContent('## New Document\nType notes here...');
      setFormCategory('Work');
      setFormTagsStr('draft');
      setFormAttachments([]);
      currentContentRef.current = '## New Document\nType notes here...';
      setIsEditing(true);
      setEditorMode('markdown');
      setSaveStatus('saved');
    }
  };

  // Save changes manually
  const handleManualSave = () => {
    if (!selectedNote) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Read final content from the active editor mode
    const finalContent = editorMode === 'markdown' ? formContent : currentContentRef.current;
    formStateRef.current.content = finalContent;

    const { title, category, tagsStr, attachments } = formStateRef.current;

    const tagsArray = tagsStr
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    updateNote({
      ...selectedNote,
      title,
      content: finalContent,
      category,
      tags: tagsArray,
      attachments,
      updatedAt: new Date().toISOString()
    });

    currentContentRef.current = finalContent;
    setFormContent(finalContent);
    setSaveStatus('saved');
    setShowSaveNotice(true);
    setTimeout(() => setShowSaveNotice(false), 2000);
  };

  // Pin / Unpin Note
  const handleTogglePin = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote({
      ...note,
      isPinned: !note.isPinned
    });
  };

  // Delete Note
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(id);
    if (selectedNoteId === id) {
      const remaining = notes.filter(n => n.id !== id);
      setSelectedNoteId(remaining[0]?.id || null);
      setIsEditing(false);
    }
  };

  // Image upload and insert logic
  const uploadAndInsertImage = async (file: File) => {
    let imageUrl = '';
    setSaveStatus('saving');
    
    if (isFirebaseConfigured && storage && profile?.uid) {
      try {
        const storageRef = ref(storage, `notes_attachments/${profile.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (e) {
        console.error("Storage upload failed, fallback to local:", e);
        imageUrl = URL.createObjectURL(file);
      }
    } else {
      imageUrl = URL.createObjectURL(file);
    }

    const textarea = document.getElementById('note-markdown-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const replacement = `![${file.name}](${imageUrl})`;
      const newContent = formContent.substring(0, start) + replacement + formContent.substring(end);
      setFormContent(newContent);
      currentContentRef.current = newContent;
      formStateRef.current.content = newContent;
      triggerAutoSave();
    }
    setSaveStatus('saved');
  };

  // Attachment upload logic
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setSaveStatus('saving');
    let attachmentUrl = '';
    
    if (isFirebaseConfigured && storage && profile?.uid) {
      try {
        const storageRef = ref(storage, `notes_attachments/${profile.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error("Storage upload failed, fallback to local:", err);
        attachmentUrl = URL.createObjectURL(file);
      }
    } else {
      attachmentUrl = URL.createObjectURL(file);
    }

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const newAttachment: Attachment = {
      id: `attach-${Date.now()}`,
      name: file.name,
      url: attachmentUrl,
      size: `${sizeInMb} MB`,
      mimeType: file.type || 'application/octet-stream'
    };

    const updatedAttachments = [...formStateRef.current.attachments, newAttachment];
    setFormAttachments(updatedAttachments);
    formStateRef.current.attachments = updatedAttachments;
    triggerAutoSave();
    setSaveStatus('saved');
    
    // Reset file input target value so the same file can be uploaded again
    e.target.value = '';
  };

  // Delete attachment
  const handleDeleteAttachment = (attachId: string) => {
    const updated = formStateRef.current.attachments.filter(a => a.id !== attachId);
    setFormAttachments(updated);
    formStateRef.current.attachments = updated;
    triggerAutoSave();
  };

  // Trigger file click
  const triggerImageUpload = () => {
    document.getElementById('image-upload-input')?.click();
  };

  const triggerAttachmentUpload = () => {
    document.getElementById('attachment-upload-input')?.click();
  };

  // Drag over editor canvas
  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  };

  // Drop element into editor
  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await uploadAndInsertImage(file);
      }
    }
  };

  // Paste handler
  const handlePaste = async (e: React.ClipboardEvent<HTMLElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await uploadAndInsertImage(file);
        }
      }
    }
  };

  // Export functionalities
  const handleExportTxt = () => {
    if (!selectedNote) return;
    const content = `Title: ${formTitle}\nCategory: ${formCategory}\nTags: ${formTagsStr}\nCreated: ${new Date(selectedNote.createdAt).toLocaleDateString()}\n\n---\n\n${currentContentRef.current}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formTitle.toLowerCase().replace(/\s+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Voice typist voice-to-text dictation
  const handleToggleVoiceDictation = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechError("Voice input is not supported in this browser version. Use modern Chrome or Edge.");
      simulateVoiceDictation();
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      setSpeechError(null);
      // Explicitly request user permission via getUserMedia to trigger the prompt correctly
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript) {
          insertTextAtCursor(" " + transcript.trim());
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        if (event.error === 'not-allowed') {
          setSpeechError("Microphone permission was denied. Please click the camera/mic icon in the browser address bar to allow access and try again.");
        } else {
          setSpeechError(`Voice input issue: ${event.error}`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setSpeechError("Microphone permission was denied. Please click the camera/mic icon in the browser's address bar to allow access and try again.");
      setIsRecording(false);
    }
  };

  // Simulated Dictation Fallback
  const simulateVoiceDictation = () => {
    setIsRecording(true);
    setSpeechError(null);
    const mockDictations = [
      "Brainstorm ideas for standardising our product dashboard layout.",
      "Incorporate robust dark mode typography pairing lists.",
      "Add security constraints to database file rules.",
      "Coordinate with product designers for Inter and JetBrains Mono pairings."
    ];
    setTimeout(() => {
      const text = mockDictations[Math.floor(Math.random() * mockDictations.length)];
      insertTextAtCursor("\n\n* [Voice Note]: " + text);
      setIsRecording(false);
    }, 2500);
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = document.getElementById('note-markdown-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = formContent.substring(0, start) + text + formContent.substring(end);
      setFormContent(newContent);
      currentContentRef.current = newContent;
      formStateRef.current.content = newContent;
      triggerAutoSave();
    }
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinkDialogOpen(false);
    if (!linkUrl) return;

    const textarea = document.getElementById('note-markdown-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textToUse = linkText.trim() || textarea.value.substring(start, end) || linkUrl;
      const replacement = `[${textToUse}](${linkUrl})`;
      const newContent = formContent.substring(0, start) + replacement + formContent.substring(end);
      setFormContent(newContent);
      currentContentRef.current = newContent;
      formStateRef.current.content = newContent;
      triggerAutoSave();
    }
  };

  // Get active text metrics
  const getPlainContentText = (): string => {
    return formContent || '';
  };

  const plainText = getPlainContentText();
  const charCount = plainText.length;
  const wordCount = plainText.trim() === '' ? 0 : plainText.trim().split(/\s+/).length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col text-slate-800 dark:text-slate-200">
      
      {/* Scope CSS Styles for WYSIWYG editor rendering */}
      <style dangerouslySetInnerHTML={{ __html: `
        .wysiwyg-editor h1 { font-size: 2rem !important; font-weight: 800 !important; margin-top: 1.5rem !important; margin-bottom: 0.75rem !important; font-family: "Inter", sans-serif; }
        .wysiwyg-editor h2 { font-size: 1.625rem !important; font-weight: 700 !important; margin-top: 1.25rem !important; margin-bottom: 0.625rem !important; font-family: "Inter", sans-serif; }
        .wysiwyg-editor h3 { font-size: 1.375rem !important; font-weight: 700 !important; margin-top: 1rem !important; margin-bottom: 0.5rem !important; font-family: "Inter", sans-serif; }
        .wysiwyg-editor h4 { font-size: 1.25rem !important; font-weight: 700 !important; margin-top: 0.875rem !important; margin-bottom: 0.5rem !important; }
        .wysiwyg-editor h5 { font-size: 1.125rem !important; font-weight: 700 !important; margin-top: 0.75rem !important; margin-bottom: 0.375rem !important; }
        .wysiwyg-editor h6 { font-size: 1rem !important; font-weight: 700 !important; margin-top: 0.625rem !important; margin-bottom: 0.25rem !important; }
        .wysiwyg-editor ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
        .wysiwyg-editor ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
        .wysiwyg-editor blockquote { border-left: 4px solid #6366f1 !important; padding-left: 1rem !important; margin-top: 0.75rem !important; margin-bottom: 0.75rem !important; font-style: italic !important; color: #4b5563 !important; }
        .wysiwyg-editor pre { background-color: #f1f5f9 !important; padding: 1rem !important; border-radius: 0.75rem !important; font-family: monospace !important; font-size: 0.875rem !important; overflow-x: auto !important; margin-top: 0.75rem !important; margin-bottom: 0.75rem !important; }
        .dark .wysiwyg-editor pre { background-color: #0f172a !important; border-color: #1e293b !important; }
        .wysiwyg-editor a { color: #4f46e5 !important; text-decoration: underline !important; font-weight: 500 !important; }
        .wysiwyg-editor img { max-width: 100% !important; height: auto !important; border-radius: 1rem !important; margin-top: 1rem !important; margin-bottom: 1rem !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; }
        .wysiwyg-editor hr { border-top: 2px solid #e2e8f0 !important; margin: 1.5rem 0 !important; }
        .dark .wysiwyg-editor hr { border-top-color: #1e293b !important; }
        .wysiwyg-editor input[type="checkbox"] { width: 1rem !important; height: 1rem !important; margin-right: 0.5rem !important; accent-color: #4f46e5 !important; cursor: pointer !important; }
      ` }} />

      {/* Invisible inputs for file triggers */}
      <input 
        type="file" 
        id="image-upload-input" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            uploadAndInsertImage(e.target.files[0]);
          }
        }} 
      />
      <input 
        type="file" 
        id="attachment-upload-input" 
        className="hidden" 
        onChange={handleAttachmentUpload} 
      />

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: Notes browsing list view (Full Screen Cards Grid) */}
        {!isEditing ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white">Workspace Notes</h2>
                <p className="text-sm text-slate-400">Manage rich thoughts, documentation, plans and conceptual structures beautifully.</p>
              </div>
              <button
                id="notes-new-btn"
                onClick={handleStartCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/15 self-start md:self-auto transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>New Note</span>
              </button>
            </div>

            {/* Searching & Filter utilities row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, logs, summaries..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Categorization filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                    activeCategory === 'all' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                      activeCategory === cat 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                        : 'bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Bento-style spacious Cards Grid */}
            {sortedNotes.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                <FolderOpen className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-500 dark:text-slate-400">No notes found matching filters</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Create a fresh Workspace note to keep logs, documentation, checklists and summaries saved securely.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedNotes.map(note => (
                  <motion.div
                    key={note.id}
                    layoutId={`note-card-${note.id}`}
                    onClick={() => handleSelectNote(note)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 p-6 rounded-3xl cursor-pointer hover:shadow-xl dark:hover:shadow-black/20 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all text-left group relative flex flex-col justify-between min-h-[220px]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="overflow-hidden">
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                            {note.category}
                          </span>
                          <h4 className="text-base font-extrabold text-slate-800 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {note.title}
                          </h4>
                        </div>

                        {/* Top quick actions */}
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <button 
                            onClick={(e) => handleTogglePin(note, e)}
                            className={`p-1.5 rounded-xl transition-all ${
                              note.isPinned 
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' 
                                : 'text-slate-300 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                            }`}
                            title={note.isPinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin className="w-4 h-4 fill-current" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(note.id, e)}
                            className="p-1.5 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Snippet representation */}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 line-clamp-4 leading-relaxed font-sans">
                        {note.content
                          .replace(/!\[.*?\]\(.*?\)/g, '')
                          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                          .replace(/[#*`_\-<>]/g, '')
                          .trim()
                          .slice(0, 150)}
                        {note.content.length > 150 && '...'}
                      </p>
                    </div>

                    {/* Bottom metrics & tags */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                      
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center space-x-1 max-w-[150px] overflow-hidden truncate bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded-lg">
                          <TagIcon className="w-3 h-3 text-indigo-500" />
                          <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">{note.tags.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          
          /* VIEW 2: DEDICATED FULL-PAGE NOTE EDITOR SCREEN */
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col space-y-6"
          >
            {/* Editor Nav Header */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3.5">
                <button
                  id="note-back-btn"
                  onClick={() => {
                    handleManualSave();
                    setIsEditing(false);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="Go back to Notes browser list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 tracking-wider font-mono">
                      {formCategory}
                    </span>
                    {/* Live Cloud Auto-sync Status info */}
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                      <span>{saveStatus === 'saved' ? 'Auto-saved' : 'Saving...'}</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-slate-800 dark:text-white mt-0.5 truncate max-w-xs md:max-w-md">
                    {formTitle || 'Untitled Note'}
                  </h3>
                </div>
              </div>

              {/* Top toolbar actions */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Segmented Editor Mode Controls */}
                <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setEditorMode('markdown');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      editorMode === 'markdown'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => {
                      currentContentRef.current = formContent;
                      setEditorMode('preview');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      editorMode === 'preview'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                    }`}
                  >
                    Preview
                  </button>
                </div>

                {/* TXT Export and Print fallbacks */}
                <button
                  onClick={handleExportTxt}
                  className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 transition-all"
                  title="Download as Plain Text file"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">TXT</span>
                </button>

                {/* Save button with visual success feedback */}
                <button
                  id="note-save-btn"
                  onClick={handleManualSave}
                  className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  {showSaveNotice ? <Check className="w-4.5 h-4.5" /> : <Save className="w-4.5 h-4.5" />}
                  <span>{showSaveNotice ? 'Saved!' : 'Save Draft'}</span>
                </button>
              </div>
            </div>

            {/* Main Workspace Frame */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Left Form Area (Title, Category, Editor Canvas) */}
              <div className="lg:col-span-3 space-y-4">
                
                {/* Inputs for Title and Category */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Document Title</label>
                    <input 
                      type="text"
                      value={formTitle}
                      onChange={(e) => {
                        setFormTitle(e.target.value);
                        formStateRef.current.title = e.target.value;
                        triggerAutoSave();
                      }}
                      className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-sm font-extrabold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        formStateRef.current.category = e.target.value;
                        triggerAutoSave();
                      }}
                      className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* EDITOR CANVAS CONTAINER */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                  
                  {/* Markdown Formatting Toolbar */}
                  {editorMode !== 'preview' && (
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/40">
                      {/* Links and image uploads */}
                      <button 
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const textarea = document.getElementById('note-markdown-textarea') as HTMLTextAreaElement | null;
                          let selText = '';
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            selText = textarea.value.substring(start, end);
                          }
                          setLinkText(selText);
                          setLinkUrl('');
                          setIsLinkDialogOpen(true);
                        }} 
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 text-xs font-medium transition-all" 
                        title="Insert Link"
                      >
                        <LinkIcon className="w-4 h-4 text-indigo-500" />
                        <span>Insert Link</span>
                      </button>
                      <button 
                        onMouseDown={(e) => e.preventDefault()} 
                        onClick={triggerImageUpload} 
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 text-xs font-medium transition-all" 
                        title="Upload & Insert Image"
                      >
                        <ImageIcon className="w-4 h-4 text-indigo-500" />
                        <span>Insert Image</span>
                      </button>

                      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                      {/* Speech typing dictation */}
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleToggleVoiceDictation}
                        className={`p-1.5 rounded flex items-center space-x-1.5 text-xs font-extrabold transition-all ${
                          isRecording 
                            ? 'bg-rose-500 text-white animate-pulse' 
                            : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-500'
                        }`}
                        title="Speech-to-text Voice Typist"
                      >
                        {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-indigo-500" />}
                        <span>{isRecording ? 'Recording...' : 'Voice Typist'}</span>
                      </button>
                      
                      {speechError && (
                        <span className="text-[10px] text-rose-500 font-bold ml-2">{speechError}</span>
                      )}
                    </div>
                  )}

                  {/* ACTIVE EDITOR CANVAS WORKSPACE */}
                  <div className="p-6 flex-1 min-h-[420px] bg-slate-50/20 dark:bg-slate-950/10">
                    
                    

                    {/* MODE B: Raw Markdown Editor */}
                    {editorMode === 'markdown' && (
                      <textarea
                        id="note-markdown-textarea"
                        value={formContent}
                        onChange={(e) => {
                          setFormContent(e.target.value);
                          currentContentRef.current = e.target.value;
                          formStateRef.current.content = e.target.value;
                          triggerAutoSave();
                        }}
                        placeholder="Type Markdown content here... (e.g. # Header, **bold**, etc.)"
                        className="w-full min-h-[400px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white resize-none leading-relaxed"
                        style={{ minHeight: '400px' }}
                      />
                    )}

                    {/* MODE C: Read-Only Formatted Preview */}
                    {editorMode === 'preview' && (
                      <div className="bg-white dark:bg-slate-950 p-6 border border-slate-100 dark:border-slate-850 rounded-2xl min-h-[400px] prose prose-slate dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-sans">
                        <div className="markdown-body">
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 dark:text-indigo-400 underline font-semibold hover:text-indigo-500 transition-colors"
                                />
                              ),
                              img: ({ node, ...props }) => (
                                <img
                                  {...props}
                                  referrerPolicy="no-referrer"
                                  className="max-w-full h-auto rounded-xl shadow-md my-3 border border-slate-200 dark:border-slate-800"
                                />
                              ),
                            }}
                          >
                            {formContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Editor Footer Status Metrics */}
                  <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div className="flex items-center space-x-4">
                      <span>{wordCount} words</span>
                      <span>{charCount} characters</span>
                    </div>
                    {selectedNote && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Last modified: {new Date(selectedNote.updatedAt).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar Area (Metadata: Tags, Attachments) */}
              <div className="space-y-6">
                
                {/* Meta block: Tags selection */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3.5">
                  <div className="flex items-center space-x-1.5 text-slate-800 dark:text-white font-extrabold text-xs">
                    <TagIcon className="w-4 h-4 text-indigo-500" />
                    <span>Tags & Labels</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Comma-separated Tags</label>
                    <input 
                      type="text" 
                      value={formTagsStr}
                      onChange={(e) => {
                        setFormTagsStr(e.target.value);
                        formStateRef.current.tagsStr = e.target.value;
                        triggerAutoSave();
                      }}
                      placeholder="e.g. design, sprint, guide"
                      className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                  
                  {/* Tag preview chips list */}
                  {formTagsStr.trim().length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {formTagsStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).map((tag, index) => (
                        <span key={index} className="px-2.5 py-0.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta block: Attachments & uploads */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-slate-800 dark:text-white font-extrabold text-xs">
                      <Paperclip className="w-4 h-4 text-indigo-500" />
                      <span>Attachments</span>
                    </div>
                    
                    <button
                      onClick={triggerAttachmentUpload}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1 border border-slate-100 dark:border-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add File</span>
                    </button>
                  </div>

                  {/* List of attachments uploaded */}
                  {formAttachments.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                      <Paperclip className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto mb-1.5" />
                      <p className="text-[10px] font-bold text-slate-400">No attachments yet</p>
                      <p className="text-[9px] text-slate-450 mt-0.5">Upload PDFs, checklists, design resources, or worksheets.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {formAttachments.map((file) => {
                        const isImage = file.mimeType?.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                        return (
                          <div 
                            key={file.id} 
                            className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850 rounded-xl flex items-center justify-between gap-2"
                          >
                            <div className="overflow-hidden min-w-0 flex items-center space-x-2">
                              {isImage ? (
                                <img 
                                  src={file.url} 
                                  alt={file.name}
                                  className="w-8 h-8 object-cover rounded-lg border border-slate-200/50 dark:border-slate-800 flex-shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate" title={file.name}>
                                  {file.name}
                                </p>
                                {file.size && <p className="text-[9px] font-mono text-slate-400">{file.size}</p>}
                              </div>
                            </div>

                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-850"
                              title="Download attachment"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(file.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-850"
                              title="Remove attachment"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern custom link insertion dialog (no iframe restrictions, works perfectly) */}
      <AnimatePresence>
        {isLinkDialogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-indigo-500" />
                  <span>Insert Hyperlink</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsLinkDialogOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleInsertLink} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Link Text (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Reference Material, Website"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Web Address URL (Required)</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    required
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLinkDialogOpen(false)}
                    className="px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 transition-colors"
                  >
                    Insert Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesModule;
