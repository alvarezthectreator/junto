import React from 'react';
import { motion } from 'framer-motion';
import { Search, Paperclip, Smile, Send } from 'lucide-react';
export function Messages() {
  const conversations = [
  {
    id: 1,
    name: 'Oge',
    initial: 'O',
    color: 'bg-[#4ECDC4]',
    preview: 'Sounds good! See you there.',
    time: '2m',
    unread: true,
    context: 'Re: Beach day 🌊'
  },
  {
    id: 2,
    name: 'Tunde',
    initial: 'T',
    color: 'bg-[#38BDF8]',
    preview: 'Are we still on for tomorrow?',
    time: '1h',
    unread: false,
    context: 'Re: hit the gym 💪'
  },
  {
    id: 3,
    name: 'Zara',
    initial: 'Z',
    color: 'bg-[#FB7185]',
    preview: 'I love that place!',
    time: 'Yesterday',
    unread: false,
    context: 'Re: try sushi 🍣'
  },
  {
    id: 4,
    name: 'Kemi',
    initial: 'K',
    color: 'bg-[#F59E0B]',
    preview: 'Can I bring a plus one?',
    time: 'Yesterday',
    unread: false,
    context: 'Re: grab brunch ☕'
  },
  {
    id: 5,
    name: 'Chidi',
    initial: 'C',
    color: 'bg-[#FF8E72]',
    preview: 'What time are you heading out?',
    time: 'Mon',
    unread: false,
    context: 'Re: go clubbing 🪩'
  },
  {
    id: 6,
    name: 'Ada',
    initial: 'A',
    color: 'bg-[#FF6B6B]',
    preview: 'Got the tickets!',
    time: 'Sun',
    unread: false,
    context: 'Re: watch a movie 🎬'
  }];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.3
      }}
      className="flex h-auto flex-col gap-4 lg:h-[calc(100vh-140px)] lg:flex-row lg:gap-6">
      
      {/* Left Pane: Conversation List */}
      <div className="w-full shrink-0 overflow-hidden rounded-3xl border border-white/5 bg-[#1A1A21] flex flex-col lg:w-[340px]">
        <div className="p-5 border-b border-white/5">
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={16} />
            
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full bg-[#0F0F13] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#F59E0B]/50 transition-colors" />
            
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button className="px-3 py-1.5 rounded-full bg-[#F59E0B] text-white text-xs font-medium whitespace-nowrap">
              All
            </button>
            <button className="px-3 py-1.5 rounded-full bg-[#0F0F13] border border-white/5 text-gray-400 hover:text-white text-xs font-medium whitespace-nowrap transition-colors">
              Unread
            </button>
            <button className="px-3 py-1.5 rounded-full bg-[#0F0F13] border border-white/5 text-gray-400 hover:text-white text-xs font-medium whitespace-nowrap transition-colors">
              Active hangouts
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {conversations.map((chat, idx) =>
          <button
            key={chat.id}
            className={`w-full p-4 flex items-start gap-3 text-left transition-colors border-b border-white/5 last:border-0 ${idx === 0 ? 'bg-white/5' : 'hover:bg-white/5'}`}>
            
              <div className="relative shrink-0">
                <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-serif text-gray-900 shadow-sm ${chat.color}`}>
                
                  {chat.initial}
                </div>
                {chat.unread &&
              <div className="absolute top-0 right-0 w-3 h-3 bg-[#F59E0B] border-2 border-[#1A1A21] rounded-full"></div>
              }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4
                  className={`text-sm truncate ${chat.unread ? 'font-semibold text-white' : 'font-medium text-gray-200'}`}>
                  
                    {chat.name}
                  </h4>
                  <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                    {chat.time}
                  </span>
                </div>
                <p
                className={`text-xs truncate mb-1.5 ${chat.unread ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
                
                  {chat.preview}
                </p>
                <span className="inline-block px-2 py-0.5 bg-[#0F0F13] rounded text-[10px] text-gray-400 truncate max-w-full">
                  {chat.context}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Right Pane: Active Thread */}
      <div className="min-h-[420px] flex-1 overflow-hidden rounded-3xl border border-white/5 bg-[#1A1A21] flex flex-col">
        {/* Thread Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4ECDC4] flex items-center justify-center text-gray-900 font-serif text-lg shadow-sm">
              O
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Oge</h3>
              <p className="text-xs text-gray-400">
                planning Beach day 🌊 · Monday 3pm
              </p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-full bg-white/5 text-white text-xs font-medium hover:bg-white/10 transition-colors">
            View request
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div className="text-center mb-4">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-[#0F0F13] px-3 py-1 rounded-full">
              Today
            </span>
          </div>

          <div className="flex flex-col gap-1 items-start max-w-[80%]">
            <div className="bg-[#0F0F13] text-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm">
              Hey! Thanks for showing interest in the beach day.
            </div>
            <div className="bg-[#0F0F13] text-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm">
              Are you coming from the island or mainland?
            </div>
            <span className="text-[10px] text-gray-500 ml-1 mt-1">
              10:42 AM
            </span>
          </div>

          <div className="flex flex-col gap-1 items-end max-w-[80%] self-end">
            <div className="bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm">
              Hey Oge! I'm on the island already.
            </div>
            <div className="bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm">
              Can easily meet you guys there by 3.
            </div>
            <span className="text-[10px] text-gray-500 mr-1 mt-1">
              10:45 AM
            </span>
          </div>

          <div className="flex flex-col gap-1 items-start max-w-[80%]">
            <div className="bg-[#0F0F13] text-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm">
              Perfect! We're meeting at the main entrance.
            </div>
            <div className="bg-[#0F0F13] text-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm">
              Sounds good! See you there.
            </div>
            <span className="text-[10px] text-gray-500 ml-1 mt-1">
              10:48 AM
            </span>
          </div>

          <div className="mt-auto pt-4">
            <p className="text-xs text-gray-500 italic">Oge is typing...</p>
          </div>
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 bg-[#0F0F13] border border-white/5 rounded-full p-1.5 pr-2">
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none px-2" />
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <Smile size={18} />
            </button>
            <button className="p-2 bg-[#F59E0B] text-white rounded-full hover:opacity-90 transition-opacity ml-1">
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>);

}
