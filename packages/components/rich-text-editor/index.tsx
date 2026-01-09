'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [editorValue, setEditorValue] = useState(value || '');

  useEffect(() => {
    setEditorValue(value || '');
  }, [value]);

  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ script: 'sub' }, { script: 'super' }],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'script',
    'blockquote',
    'code-block',
    'list',
    'indent',
    'color',
    'background',
    'align',
    'link',
    'image',
    'video',
  ];

  return (
    <div className="relative">
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder="Write a detailed product description here..."
        className="bg-transparent border border-gray-700 text-white rounded-md"
        style={{ minHeight: '250px' }}
      />
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 0.375rem 0.375rem 0 0;
          padding: 8px;
        }

        .ql-container.ql-snow {
          background: #0f172a;
          border: 1px solid #374151;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
          font-size: 14px;
        }

        .ql-editor {
          min-height: 200px;
          color: #e5e7eb;
          padding: 12px 15px;
        }

        .ql-editor.ql-blank::before {
          color: #6b7280;
          font-style: normal;
          left: 15px;
        }

        .ql-editor p,
        .ql-editor h1,
        .ql-editor h2,
        .ql-editor h3,
        .ql-editor h4,
        .ql-editor h5,
        .ql-editor h6,
        .ql-editor ul,
        .ql-editor ol,
        .ql-editor li {
          color: #e5e7eb;
        }

        .ql-editor blockquote {
          border-left: 4px solid #60a5fa;
          padding-left: 16px;
          color: #9ca3af;
          font-style: italic;
          margin: 16px 0;
        }

        .ql-editor pre.ql-syntax {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 0.375rem;
          color: #e5e7eb;
          padding: 12px;
          overflow-x: auto;
        }

        .ql-editor a {
          color: #60a5fa;
          text-decoration: underline;
        }

        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
        }

        .ql-stroke {
          stroke: #9ca3af !important;
        }

        .ql-fill {
          fill: #9ca3af !important;
        }

        .ql-picker-label {
          color: #9ca3af !important;
        }

        .ql-picker-options {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
        }

        .ql-picker-item {
          color: #e5e7eb !important;
        }

        .ql-picker-item:hover {
          background: #374151 !important;
          color: #60a5fa !important;
        }

        .ql-toolbar button:hover,
        .ql-toolbar button:focus {
          color: #60a5fa !important;
        }

        .ql-toolbar button:hover .ql-stroke,
        .ql-toolbar button:focus .ql-stroke {
          stroke: #60a5fa !important;
        }

        .ql-toolbar button:hover .ql-fill,
        .ql-toolbar button:focus .ql-fill {
          fill: #60a5fa !important;
        }

        .ql-toolbar button.ql-active,
        .ql-toolbar .ql-picker-label.ql-active {
          color: #60a5fa !important;
        }

        .ql-toolbar button.ql-active .ql-stroke {
          stroke: #60a5fa !important;
        }

        .ql-toolbar button.ql-active .ql-fill {
          fill: #60a5fa !important;
        }

        .ql-picker-label.ql-active .ql-stroke {
          stroke: #60a5fa !important;
        }

        .ql-snow .ql-tooltip {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
          color: #e5e7eb !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 9999;
        }

        .ql-snow .ql-tooltip input[type='text'] {
          background: #0f172a !important;
          border: 1px solid #374151 !important;
          color: #e5e7eb !important;
        }

        .ql-snow .ql-tooltip input[type='text']::placeholder {
          color: #6b7280 !important;
        }

        .ql-snow .ql-tooltip a {
          color: #60a5fa !important;
        }

        .ql-snow .ql-tooltip a:hover {
          color: #3b82f6 !important;
        }

        .ql-snow .ql-tooltip .ql-action::after {
          border-right-color: #374151 !important;
        }

        .ql-snow .ql-tooltip .ql-remove::before {
          color: #ef4444 !important;
        }

        .ql-editor iframe {
          border-radius: 0.375rem;
          max-width: 100%;
        }

        .ql-snow.ql-toolbar button,
        .ql-snow .ql-toolbar button {
          width: 28px;
          height: 24px;
          display: inline-block;
          cursor: pointer;
        }

        .ql-snow.ql-toolbar button svg,
        .ql-snow .ql-toolbar button svg {
          width: 18px;
          height: 18px;
        }

        .ql-formats {
          display: inline-block;
          vertical-align: middle;
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
