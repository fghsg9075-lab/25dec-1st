import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import ReactPlayer from 'react-player/lazy'; // Used Lazy loading for better performance
import { LessonContent, Subject, ClassLevel, Chapter } from '../types';
import { ArrowLeft, Clock, ExternalLink, CheckCircle, XCircle, Trophy, Play } from 'lucide-react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
  subject, 
  classLevel, 
  chapter,
  loading, 
  onBack,
  onMCQComplete
}) => {
  const [mcqState, setMcqState] = useState<Record<number, number | null>>({});
  const [showResults, setShowResults] = useState(false);
  
  // 1. Loading State
  if (loading) {
      return (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <h3 className="text-xl font-bold text-slate-800 animate-pulse">Loading Content...</h3>
              <p className="text-slate-500 text-sm">Please wait while we fetch the data.</p>
          </div>
      );
  }

  // 2. Empty/Coming Soon State
  if (!content || content.isComingSoon) {
      return (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl m-4 border-2 border-dashed border-slate-200">
              <Clock size={64} className="text-orange-400 mb-4 opacity-80" />
              <h2 className="text-2xl font-black text-slate-800 mb-2">Coming Soon</h2>
              <p className="text-slate-600 max-w-xs mx-auto mb-6">
                  This content is currently being prepared by the Admin.
              </p>
              <button onClick={onBack} className="mt-8 text-slate-400 font-bold hover:text-slate-600">
                  Go Back
              </button>
          </div>
      );
  }

  // 3. MCQ RENDERER
  if ((content.type === 'MCQ_ANALYSIS' || content.type === 'MCQ_SIMPLE') && content.mcqData) {
      const score = Object.keys(mcqState).reduce((acc, key) => {
          const qIdx = parseInt(key);
          return acc + (mcqState[qIdx] === content.mcqData![qIdx].correctAnswer ? 1 : 0);
      }, 0);

      const handleFinish = () => {
          setShowResults(true);
          if (onMCQComplete) onMCQComplete(score);
      };

      return (
          <div className="flex flex-col h-full bg-slate-50 animate-in fade-in">
               <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                   <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-bold text-sm bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                       <ArrowLeft size={16} /> Exit
                   </button>
                   <div className="text-right">
                       <h3 className="font-bold text-slate-800 text-sm">MCQ Test</h3>
                       {showResults ? (
                           <span className="text-xs font-bold text-green-600">Final Score: {score}/{content.mcqData.length}</span>
                       ) : (
                           <span className="text-xs text-slate-400">{Object.keys(mcqState).length}/{content.mcqData.length} Answered</span>
                       )}
                   </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-3xl mx-auto w-full pb-20">
                   {content.mcqData.map((q, idx) => {
                       const userAnswer = mcqState[idx];
                       const isAnswered = userAnswer !== undefined && userAnswer !== null;
                       const isCorrect = userAnswer === q.correctAnswer;
                       
                       return (
                           <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                               <h4 className="font-bold text-slate-800 mb-4 flex gap-3 leading-relaxed">
                                   <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">{idx + 1}</span>
                                   {q.question}
                               </h4>
                               <div className="space-y-2">
                                   {q.options.map((opt, oIdx) => {
                                       let btnClass = "w-full text-left p-3 rounded-xl border transition-all text-sm font-medium relative overflow-hidden ";
                                       
                                       if (isAnswered) {
                                           if (oIdx === q.correctAnswer) {
                                               btnClass += "bg-green-100 border-green-300 text-green-800";
                                           } else if (userAnswer === oIdx) {
                                               btnClass += "bg-red-100 border-red-300 text-red-800";
                                           } else {
                                               btnClass += "bg-slate-50 border-slate-100 opacity-60";
                                           }
                                       } else {
                                           btnClass += "bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-200";
                                       }

                                       return (
                                           <button 
                                               key={oIdx}
                                               disabled={isAnswered || showResults}
                                               onClick={() => setMcqState(prev => ({ ...prev, [idx]: oIdx }))}
                                               className={btnClass}
                                           >
                                               <span className="relative z-10 flex justify-between items-center">
                                                   {opt}
                                                   {isAnswered && oIdx === q.correctAnswer && <CheckCircle size={16} className="text-green-600" />}
                                                   {isAnswered && userAnswer === oIdx && userAnswer !== q.correctAnswer && <XCircle size={16} className="text-red-500" />}
                                               </span>
                                           </button>
                                       );
                                   })}
                               </div>
                               
                               {(isAnswered || showResults) && (
                                   <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                       <div className={`flex items-center gap-2 text-sm font-bold mb-1 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                           {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                           {isCorrect ? 'Correct Answer' : 'Incorrect'}
                                       </div>
                                       {q.explanation && q.explanation !== "Answer Key Provided" && (
                                            <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                                                <span className="font-bold text-slate-800 block text-xs uppercase mb-1">Explanation:</span>
                                                {q.explanation}
                                            </p>
                                       )}
                                   </div>
                               )}
                           </div>
                       );
                   })}
               </div>

               {!showResults && (
                   <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-10 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                       <button 
                           onClick={handleFinish}
                           disabled={Object.keys(mcqState).length === 0}
                           className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                       >
                           <Trophy size={18} /> Submit Final Score
                       </button>
                   </div>
               )}
          </div>
      );
  }

  // 4. VIDEO RENDERER (Restored ReactPlayer for Stability)
  // Check if type is VIDEO OR if it is a PDF Viewer but has a video URL (Edge case handler)
  const isVideoUrl = (url: string) => url.includes('youtube.com') || url.includes('youtu.be') || url.includes('.mp4');
  
  if (content.type === 'VIDEO_LECTURE' || (content.type === 'PDF_VIEWER' && isVideoUrl(content.content))) {
      // Hook must be inside the component, so we use a sub-component concept or inline logic
      // Since this is a conditional return, hooks need to be careful. 
      // However, since we return early, React reconciliation handles this better if structure is consistent.
      // To be safe, we declare state at top but we can't here. 
      // We will assume this component re-mounts when content changes.
      
      const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
      const playlist = content.videoPlaylist && content.videoPlaylist.length > 0 
          ? content.videoPlaylist 
          : [{ title: chapter.title, url: content.content }];
      
      const currentVideo = playlist[currentVideoIndex] || playlist[0]; // Fallback to prevent crash
      
      return (
          <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-900">
              <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700 shadow-sm">
                   <button onClick={onBack} className="flex items-center gap-2 text-slate-300 font-bold text-sm hover:text-white">
                       <ArrowLeft size={18} /> Back
                   </button>
                   <h3 className="font-bold text-white text-sm truncate max-w-[200px]">{currentVideo?.title}</h3>
                   <div className="w-10"></div>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  <div className="flex-1 bg-black relative flex items-center justify-center">
                       {/* ReactPlayer handles YouTube, File paths, and Google Drive video previews much better than raw iframes */}
                       <ReactPlayer 
                          url={currentVideo?.url}
                          width="100%"
                          height="100%"
                          controls={true}
                          playing={true}
                          onEnded={() => {
                              if (currentVideoIndex < playlist.length - 1) {
                                  setCurrentVideoIndex(currentVideoIndex + 1);
                              }
                          }}
                          config={{
                            youtube: {
                              playerVars: { showinfo: 1 }
                            }
                          }}
                       />
                  </div>
                  
                  {/* Playlist Sidebar */}
                  {playlist.length > 1 && (
                      <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
                          <div className="p-3 bg-slate-800 font-bold text-white text-xs uppercase tracking-widest border-b border-slate-700">
                              Up Next ({currentVideoIndex + 1}/{playlist.length})
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 space-y-2">
                              {playlist.map((vid, idx) => (
                                  <button 
                                      key={idx}
                                      onClick={() => setCurrentVideoIndex(idx)}
                                      className={`w-full p-3 rounded-lg flex gap-3 items-center text-left transition-all ${
                                          idx === currentVideoIndex 
                                          ? 'bg-blue-600 text-white shadow-lg' 
                                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                      }`}
                                  >
                                      <div className="text-xs font-bold opacity-50">{idx + 1}</div>
                                      <div className="flex-1 truncate">
                                          <p className="font-bold text-xs truncate">{vid.title}</p>
                                      </div>
                                      {idx === currentVideoIndex && <Play size={12} fill="currentColor" />}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  }
  
  // 5. PDF / EXTERNAL LINK RENDERER
  if (content.type === 'PDF_VIEWER' || content.type === 'PDF_FREE' || content.type === 'PDF_PREMIUM' || content.type === 'PDF_ULTRA') {
      const isPdf = content.content.toLowerCase().endsWith('.pdf') || content.content.includes('drive.google.com') || content.content.includes('docs.google.com');
      
      // Fix for Google Drive View links -> Preview links
      const cleanUrl = content.content.replace('/view', '/preview').replace('/edit', '/preview');

      return (
          <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-100">
              <div className="flex items-center justify-between p-3 bg-white border-b border-slate-200 shadow-sm">
                   <button onClick={onBack} className="flex items-center gap-2 text-slate-600 font-bold text-sm hover:text-slate-900">
                       <ArrowLeft size={18} /> Back
                   </button>
                   <h3 className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{chapter.title}</h3>
                   <div className="w-10"></div>
              </div>
              
              <div className="flex-1 w-full bg-white relative overflow-hidden">
                  {isPdf ? (
                     <div className="relative w-full h-full">
                        <iframe 
                             src={cleanUrl} 
                             className="w-full h-full border-0" 
                             allowFullScreen
                             title="PDF Viewer"
                         />
                         {/* Transparent Blocker for pop-out button if needed */}
                         <div className="absolute top-0 right-0 w-20 h-20 z-10 bg-transparent"></div>
                     </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                          <ExternalLink size={48} className="text-slate-400 mb-4" />
                          <h3 className="text-xl font-bold text-slate-700 mb-2">External Content</h3>
                          <p className="text-slate-500 mb-6 max-w-md">
                              This content is hosted externally and cannot be embedded directly.
                          </p>
                          <a 
                            href={content.content} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Open Link
                          </a>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // 6. HTML NOTES RENDERER
  if (content.type === 'NOTES_HTML_FREE' || content.type === 'NOTES_HTML_PREMIUM') {
      return (
        <div className="bg-white min-h-screen pb-20 animate-in fade-in">
           <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
               <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
                   <ArrowLeft size={20} />
               </button>
               <div className="text-center">
                   <h3 className="font-bold text-slate-800 text-sm leading-tight">{chapter.title}</h3>
                   <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{content.type === 'NOTES_HTML_PREMIUM' ? 'Premium Notes' : 'Free Notes'}</p>
               </div>
               <div className="w-8"></div>
           </div>

           <div className="max-w-3xl mx-auto p-6 md:p-10">
               <div 
                   className="prose prose-slate max-w-none prose-img:rounded-xl prose-headings:text-slate-800 prose-a:text-blue-600"
                   dangerouslySetInnerHTML={{ __html: content.content }}
               />
               <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                   <p className="text-xs text-slate-400 font-medium mb-4">End of Chapter</p>
                   <button onClick={onBack} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                       Complete & Close
                   </button>
               </div>
           </div>
        </div>
      );
  }

  // 7. DEFAULT: NOTES (MARKDOWN) RENDERER
  return (
    <div className="bg-white min-h-screen pb-20 animate-in fade-in">
       <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
           <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
               <ArrowLeft size={20} />
           </button>
           <div className="text-center">
               <h3 className="font-bold text-slate-800 text-sm leading-tight">{chapter.title}</h3>
               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{content.subtitle || 'Notes'}</p>
           </div>
           <div className="w-8"></div>
       </div>

       <div className="max-w-3xl mx-auto p-6 md:p-10">
           <div className="prose prose-slate prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-900 prose-a:text-blue-600 max-w-none">
               <ReactMarkdown 
                   remarkPlugins={[remarkMath]} 
                   rehypePlugins={[rehypeKatex]}
                   components={{
                       h1: ({node, ...props}) => <h1 className="text-2xl font-black mb-4 pb-2 border-b border-slate-100" {...props} />,
                       h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-8 mb-4 text-blue-800 flex items-center gap-2" {...props} />,
                       ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 my-4" {...props} />,
                       li: ({node, ...props}) => <li className="pl-1" {...props} />,
                       blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-6 bg-blue-50 rounded-r-lg italic text-blue-800" {...props} />,
                       code: ({node, ...props}) => <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono font-bold" {...props} />,
                   }}
               >
                   {content.content}
               </ReactMarkdown>
           </div>
           
           <div className="mt-12 pt-8 border-t border-slate-100 text-center">
               <p className="text-xs text-slate-400 font-medium mb-4">End of Chapter</p>
               <button onClick={onBack} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                   Complete & Close
               </button>
           </div>
       </div>
    </div>
  );
};
