import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import ReactPlayer from 'react-player';
import { ArrowLeft, Clock, ExternalLink, CheckCircle, XCircle, Trophy, Play } from 'lucide-react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { LessonContent, Subject, ClassLevel, Chapter } from '../types';

interface Props {
  content: LessonContent | null;
  subject: Subject;
  classLevel: ClassLevel;
  chapter: Chapter;
  loading: boolean;
  onBack: () => void;
  onMCQComplete?: (count: number) => void;
}

export const LessonView: React.FC<Props> = ({
  content,
  chapter,
  loading,
  onBack,
  onMCQComplete
}) => {

  /* ✅ ALL HOOKS AT TOP (MOST IMPORTANT FIX) */
  const [mcqState, setMcqState] = useState<Record<number, number | null>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  /* ✅ LOADING */
  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  /* ✅ CONTENT SAFE GUARD (VERY IMPORTANT) */
  if (!content || content.isComingSoon) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center">
        <Clock size={48} className="text-orange-400 mb-4" />
        <h2 className="font-bold text-xl">Coming Soon</h2>
        <button onClick={onBack} className="mt-6 text-blue-600 font-bold">
          Go Back
        </button>
      </div>
    );
  }

  /* ===================== MCQ ===================== */
  if ((content.type === 'MCQ_SIMPLE' || content.type === 'MCQ_ANALYSIS') && content.mcqData?.length) {
    const score = Object.keys(mcqState).reduce((acc, key) => {
      const idx = Number(key);
      return acc + (mcqState[idx] === content.mcqData![idx].correctAnswer ? 1 : 0);
    }, 0);

    return (
      <div className="p-4">
        {content.mcqData.map((q, idx) => (
          <div key={idx} className="mb-6 bg-white p-4 rounded-xl border">
            <p className="font-bold mb-3">{idx + 1}. {q.question}</p>
            {q.options.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => setMcqState(prev => ({ ...prev, [idx]: oIdx }))}
                disabled={mcqState[idx] !== undefined}
                className="block w-full text-left p-2 border rounded mb-2"
              >
                {opt}
              </button>
            ))}
          </div>
        ))}
        <button
          onClick={() => onMCQComplete?.(score)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
        >
          Submit
        </button>
      </div>
    );
  }

  /* ===================== VIDEO ===================== */
  if (content.type === 'VIDEO_LECTURE') {
    const playlist =
      content.videoPlaylist?.length
        ? content.videoPlaylist
        : [{ title: chapter.title, url: content.content }];

    const currentVideo = playlist[currentVideoIndex];

    return (
      <div className="h-screen bg-black flex flex-col">
        <div className="p-3 bg-slate-800 text-white flex items-center gap-3">
          <button onClick={onBack}><ArrowLeft /></button>
          <span className="font-bold text-sm">{currentVideo.title}</span>
        </div>

        <div className="flex-1">
          <ReactPlayer
            url={currentVideo.url}
            width="100%"
            height="100%"
            controls
          />
        </div>

        {playlist.length > 1 && (
          <div className="bg-slate-900 p-2 flex gap-2 overflow-x-auto">
            {playlist.map((v, i) => (
              <button
                key={i}
                onClick={() => setCurrentVideoIndex(i)}
                className={`px-3 py-2 rounded text-sm ${
                  i === currentVideoIndex ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Play size={12} /> {v.title}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ===================== PDF ===================== */
  if (content.type.startsWith('PDF')) {
    return (
      <div className="h-screen">
        <iframe
          src={content.content.replace('/view', '/preview')}
          className="w-full h-full"
          title="PDF"
        />
      </div>
    );
  }

  /* ===================== NOTES ===================== */
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content.content}
      </ReactMarkdown>
      <button
        onClick={onBack}
        className="mt-10 bg-black text-white px-6 py-3 rounded-xl font-bold"
      >
        Close
      </button>
    </div>
  );
};
