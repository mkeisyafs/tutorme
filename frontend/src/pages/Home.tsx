import { useState, type ChangeEvent, type FormEvent } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import GenerateCourseModal from '../components/GenerateCourseModal';
import { Play, Flame, Clock, Sparkles, Paperclip, FileText, X } from 'lucide-react';

const Home = () => {
  const [topic, setTopic] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReferenceFile(event.target.files?.[0] ?? null);
  };

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (topic.trim() || referenceFile) setIsGenerateModalOpen(true);

    // BACKEND TODO: Send `topic` and `referenceFile` with FormData to the course-generation endpoint.
    // The API should accept PDF/DOCX/TXT, extract text safely, then pass that text as reference context to the AI.
    // Return a course/roadmap ID so the frontend can navigate to its real generated roadmap.
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto md:mx-0">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome back, Andi! 👋</h1>
            <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">Ready to continue your learning journey?</p>
          </div>
          
          {/* Streak Badge */}
          <div className="bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-300 dark:border-orange-700/50 px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(251,146,60,1)] dark:shadow-[4px_4px_0px_0px_rgba(194,65,12,0.8)] transform rotate-2 inline-flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
            <div>
              <div className="text-orange-900 dark:text-orange-300 font-bold font-['Kalam',cursive] text-2xl leading-none">3 Days</div>
              <div className="text-orange-700 dark:text-orange-400/80 text-sm font-bold uppercase tracking-wide">Streak</div>
            </div>
          </div>
        </div>

        {/* Generate New Course */}
        <section className="mb-16">
          <div className="bg-pink-100 dark:bg-pink-900/40 p-8 rounded-3xl border-4 border-pink-300 dark:border-pink-700/50 shadow-[8px_8px_0px_0px_rgba(244,114,182,1)] dark:shadow-[8px_8px_0px_0px_rgba(190,24,93,0.8)] transform rotate-1 relative">
            <div className="absolute -top-3 -right-4 w-12 h-6 bg-green-400/80 dark:bg-green-500/40 transform -rotate-12 backdrop-blur-sm shadow-sm pointer-events-none"></div>
            
            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-pink-900 dark:text-pink-300 mb-4 flex items-center gap-3">
              <Sparkles className="w-8 h-8 fill-pink-500 text-pink-500" />
              What do you want to learn today?
            </h2>
            <p className="text-pink-800 dark:text-pink-200/80 font-bold mb-6 font-['Nunito',sans-serif]">
              Add a topic or upload a reference file, and our AI will generate a personalized, step-by-step curriculum for you.
            </p>
            
            <form className="flex flex-col gap-4 w-full" onSubmit={handleGenerate}>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <div className="w-full relative flex-grow">
                <input 
                  type="text"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="e.g. Python for Beginners, Introduction to Economics..."
                  className="w-full px-6 py-4 rounded-full border-2 border-pink-200 dark:border-pink-800/50 shadow-inner bg-white/90 dark:bg-gray-800/90 backdrop-blur-md focus:outline-none focus:border-pink-400 dark:focus:border-pink-500/50 focus:ring-4 focus:ring-pink-300/50 dark:focus:ring-pink-900/50 font-['Nunito',sans-serif] text-lg text-gray-800 dark:text-gray-100 font-bold transition-all placeholder-gray-400 dark:placeholder-gray-500"
                />
                </div>
                <label className="w-full sm:w-auto cursor-pointer bg-white/90 dark:bg-gray-800/90 hover:bg-pink-50 dark:hover:bg-gray-700 border-2 border-dashed border-pink-400 dark:border-pink-500 text-pink-700 dark:text-pink-300 font-bold py-4 px-5 rounded-full transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                  <Paperclip className="w-5 h-5" /> Add file
                  <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
                </label>
                <button 
                type="submit"
                disabled={!topic.trim() && !referenceFile}
                className="bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-500 text-white font-bold py-4 px-8 rounded-full shadow-[0_8px_0px_0px_rgba(190,24,93,1)] dark:shadow-[0_8px_0px_0px_rgba(157,23,77,1)] hover:shadow-[0_4px_0px_0px_rgba(190,24,93,1)] dark:hover:shadow-[0_4px_0px_0px_rgba(157,23,77,1)] transform transition hover:translate-y-1 font-['Kalam',cursive] text-xl tracking-wide border-2 border-pink-700 dark:border-pink-800 flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0"
              >
                Generate Course <Sparkles className="w-5 h-5" />
              </button>
              </div>
              {referenceFile ? (
                <div className="flex items-center justify-between gap-3 bg-white/70 dark:bg-gray-800/70 border-2 border-pink-200 dark:border-pink-800/60 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0"><FileText className="w-6 h-6 text-pink-500 shrink-0" /><div className="min-w-0"><p className="font-bold text-gray-800 dark:text-gray-100 truncate">{referenceFile.name}</p><p className="text-sm font-semibold text-pink-700 dark:text-pink-300">Will be used as a course reference</p></div></div>
                  <button type="button" onClick={() => setReferenceFile(null)} aria-label="Remove selected file" className="p-2 text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/40 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
              ) : <p className="text-sm font-semibold text-pink-800 dark:text-pink-200/80">Supports PDF, DOCX, and TXT. You can generate a course using a file only.</p>}
            </form>
          </div>
        </section>

        {/* Continue Last Course */}
        <section className="mb-16">
          <h2 className="text-3xl font-['Kalam',cursive] font-bold text-blue-900 dark:text-blue-300 mb-6 flex items-center gap-3">
            <Play className="w-8 h-8 fill-blue-500 text-blue-500" />
            Pick up where you left off
          </h2>
          
          <div className="bg-blue-100 dark:bg-blue-900/40 p-8 rounded-3xl border-4 border-blue-400 dark:border-blue-700/50 shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,0.8)] transform -rotate-1 relative">
            <div className="absolute -top-4 -right-4 w-12 h-6 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm shadow-sm"></div>
            
            <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
              <div className="flex-grow">
                <span className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Web Development</span>
                <h3 className="text-3xl font-bold font-['Kalam',cursive] text-blue-950 dark:text-blue-200 mb-2">React Hooks Deep Dive</h3>
                <p className="text-blue-800 dark:text-blue-300/80 font-medium mb-6">Chapter 3: Mastering useEffect and component lifecycle.</p>
                
                {/* Progress Bar */}
                <div className="w-full bg-blue-200 dark:bg-blue-800/50 rounded-full h-4 mb-2 border border-blue-300 dark:border-blue-700">
                  <div className="bg-blue-500 dark:bg-blue-400 h-full rounded-full w-[45%]"></div>
                </div>
                <div className="text-blue-700 dark:text-blue-400 font-bold text-sm">45% Completed</div>
              </div>
              
              <button className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_8px_0px_0px_rgba(29,78,216,1)] dark:shadow-[0_8px_0px_0px_rgba(30,58,138,1)] transform transition hover:translate-y-1 hover:shadow-[0_4px_0px_0px_rgba(29,78,216,1)] dark:hover:shadow-[0_4px_0px_0px_rgba(30,58,138,1)] flex-shrink-0 w-full md:w-auto text-xl font-['Kalam',cursive] border-2 border-blue-700 dark:border-blue-800">
                Continue Learning
              </button>
            </div>
          </div>
        </section>

        {/* Recent Courses */}
        <section>
          <h2 className="text-3xl font-['Kalam',cursive] font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
            <Clock className="w-7 h-7 text-gray-600 dark:text-gray-400" />
            Recent Courses
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Course Card 1 */}
            <div className="bg-yellow-100 dark:bg-yellow-900/40 p-6 rounded-2xl border-2 border-yellow-300 dark:border-yellow-700/50 shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(161,98,7,0.8)] transform rotate-1 hover:rotate-0 transition-transform cursor-pointer relative">
              <div className="absolute top-0 left-1/2 w-16 h-4 bg-yellow-500/30 dark:bg-yellow-400/20 -translate-x-1/2 -translate-y-2"></div>
              <h3 className="text-2xl font-bold font-['Kalam',cursive] text-yellow-900 dark:text-yellow-300 mb-2">Intro to UI/UX Design</h3>
              <div className="w-full bg-yellow-200 dark:bg-yellow-800/50 rounded-full h-2 mb-2">
                <div className="bg-yellow-500 dark:bg-yellow-400 h-full rounded-full w-[80%]"></div>
              </div>
              <p className="text-yellow-700 dark:text-yellow-400/80 font-bold text-sm">80% Completed</p>
            </div>

            {/* Course Card 2 */}
            <div className="bg-green-100 dark:bg-green-900/40 p-6 rounded-2xl border-2 border-green-300 dark:border-green-700/50 shadow-[4px_4px_0px_0px_rgba(74,222,128,1)] dark:shadow-[4px_4px_0px_0px_rgba(21,128,61,0.8)] transform -rotate-2 hover:rotate-0 transition-transform cursor-pointer relative">
              <div className="absolute top-0 left-1/2 w-16 h-4 bg-green-500/30 dark:bg-green-400/20 -translate-x-1/2 -translate-y-2"></div>
              <h3 className="text-2xl font-bold font-['Kalam',cursive] text-green-900 dark:text-green-300 mb-2">Advanced TypeScript</h3>
              <div className="w-full bg-green-200 dark:bg-green-800/50 rounded-full h-2 mb-2">
                <div className="bg-green-500 dark:bg-green-400 h-full rounded-full w-[15%]"></div>
              </div>
              <p className="text-green-700 dark:text-green-400/80 font-bold text-sm">15% Completed</p>
            </div>

          </div>
        </section>

      </div>
      <GenerateCourseModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        initialTopic={topic}
        referenceFile={referenceFile}
      />
    </DashboardLayout>
  );
};

export default Home;
