import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

export interface RichTextContent {
  html: string;
  plainText: string;
  wordCount: number;
  readingTime: number;
}

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss'
})
export class RichTextEditorComponent implements OnInit, OnDestroy {
  @Input() initialContent: string = '';
  @Input() placeholder: string = 'Start writing your post...';
  @Input() maxLength: number = 10000;
  @Input() showToolbar: boolean = true;
  @Input() showWordCount: boolean = true;
  @Input() showReadingTime: boolean = true;
  
  @Output() contentChange = new EventEmitter<RichTextContent>();
  @Output() wordCountChange = new EventEmitter<number>();
  @Output() readingTimeChange = new EventEmitter<number>();

  @ViewChild('editor', { static: true }) editor!: ElementRef<HTMLDivElement>;

  content: string = '';
  wordCount: number = 0;
  readingTime: number = 0;
  isFocused: boolean = false;
  showEmojiPicker: boolean = false;
  
  private destroy$ = new Subject<void>();
  private readonly WORDS_PER_MINUTE = 200;

  // Toolbar actions
  toolbarActions = [
    { icon: 'format_bold', action: 'bold', label: 'Bold', shortcut: 'Ctrl+B' },
    { icon: 'format_italic', action: 'italic', label: 'Italic', shortcut: 'Ctrl+I' },
    { icon: 'format_underline', action: 'underline', label: 'Underline', shortcut: 'Ctrl+U' },
    { icon: 'format_strikethrough', action: 'strikethrough', label: 'Strikethrough' },
    { icon: 'divider' },
    { icon: 'format_align_left', action: 'justifyLeft', label: 'Align Left' },
    { icon: 'format_align_center', action: 'justifyCenter', label: 'Align Center' },
    { icon: 'format_align_right', action: 'justifyRight', label: 'Align Right' },
    { icon: 'format_align_justify', action: 'justifyFull', label: 'Justify' },
    { icon: 'divider' },
    { icon: 'format_list_bulleted', action: 'insertUnorderedList', label: 'Bullet List' },
    { icon: 'format_list_numbered', action: 'insertOrderedList', label: 'Numbered List' },
    { icon: 'format_indent_increase', action: 'indent', label: 'Indent' },
    { icon: 'format_indent_decrease', action: 'outdent', label: 'Outdent' },
    { icon: 'divider' },
    { icon: 'link', action: 'createLink', label: 'Insert Link' },
    { icon: 'image', action: 'insertImage', label: 'Insert Image' },
    { icon: 'code', action: 'insertCode', label: 'Insert Code' },
    { icon: 'emoji_emotions', action: 'toggleEmojiPicker', label: 'Emoji' }
  ];

  // Emoji categories
  emojiCategories = [
    { name: 'Smileys', icon: '😊', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'] },
    { name: 'Nature', icon: '🌿', emojis: ['🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁'] },
    { name: 'Food', icon: '🍕', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒'] },
    { name: 'Activities', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸'] }
  ];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit() {
    if (this.initialContent) {
      this.content = this.initialContent;
      this.updateContent();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Focus management
  onFocus() {
    this.isFocused = true;
  }

  onBlur() {
    this.isFocused = false;
    this.updateContent();
  }

  // Content updates
  onInput() {
    this.updateContent();
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
    this.updateContent();
  }

  private updateContent() {
    const html = this.editor.nativeElement.innerHTML;
    const plainText = this.editor.nativeElement.innerText || this.editor.nativeElement.textContent || '';
    
    this.content = html;
    this.wordCount = this.calculateWordCount(plainText);
    this.readingTime = this.calculateReadingTime(plainText);

    const richTextContent: RichTextContent = {
      html,
      plainText,
      wordCount: this.wordCount,
      readingTime: this.readingTime
    };

    this.contentChange.emit(richTextContent);
    this.wordCountChange.emit(this.wordCount);
    this.readingTimeChange.emit(this.readingTime);
  }

  private calculateWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateReadingTime(text: string): number {
    const words = this.calculateWordCount(text);
    return Math.ceil(words / this.WORDS_PER_MINUTE);
  }

  // Toolbar actions
  executeCommand(command: string, value?: string) {
    switch (command) {
      case 'createLink':
        this.createLink();
        break;
      case 'insertImage':
        this.insertImage();
        break;
      case 'insertCode':
        this.insertCode();
        break;
      case 'toggleEmojiPicker':
        this.showEmojiPicker = !this.showEmojiPicker;
        break;
      default:
        if (command !== 'divider') {
          document.execCommand(command, false, value);
          this.updateContent();
        }
    }
  }

  private createLink() {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      this.updateContent();
    }
  }

  private insertImage() {
    const url = prompt('Enter image URL:');
    if (url) {
      const img = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;">`;
      document.execCommand('insertHTML', false, img);
      this.updateContent();
    }
  }

  private insertCode() {
    const code = prompt('Enter code:');
    if (code) {
      const codeBlock = `<pre><code>${code}</code></pre>`;
      document.execCommand('insertHTML', false, codeBlock);
      this.updateContent();
    }
  }

  // Emoji handling
  insertEmoji(emoji: string) {
    document.execCommand('insertText', false, emoji);
    this.updateContent();
    this.showEmojiPicker = false;
  }

  // Keyboard shortcuts
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          this.executeCommand('bold');
          break;
        case 'i':
          event.preventDefault();
          this.executeCommand('italic');
          break;
        case 'u':
          event.preventDefault();
          this.executeCommand('underline');
          break;
        case 'k':
          event.preventDefault();
          this.createLink();
          break;
      }
    }
  }

  // Content validation
  validateContent(): boolean {
    if (this.content.length > this.maxLength) {
      this.snackBar.open(`Content exceeds maximum length of ${this.maxLength} characters`, 'Close', { duration: 3000 });
      return false;
    }
    return true;
  }

  // Get content for form submission
  getContent(): RichTextContent {
    const html = this.editor.nativeElement.innerHTML;
    const plainText = this.editor.nativeElement.innerText || this.editor.nativeElement.textContent || '';
    
    return {
      html,
      plainText,
      wordCount: this.calculateWordCount(plainText),
      readingTime: this.calculateReadingTime(plainText)
    };
  }

  // Clear content
  clearContent() {
    this.editor.nativeElement.innerHTML = '';
    this.updateContent();
  }

  // Set content programmatically
  setContent(content: string) {
    this.editor.nativeElement.innerHTML = content;
    this.updateContent();
  }
}





