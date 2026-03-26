import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Heart, Music, SkipBack, SkipForward, Download, Loader2, MessageCircleHeart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

const lyrics = [
  { start: 11, end: 15, text: "Melangkah pelan di taman pagi." },
  { start: 16, end: 20, text: "Melihat kamu yang sedang menyanyi." },
  { start: 21, end: 25, text: "Malu-malu kucing kusembunyi di sini." },
  { start: 26, end: 30, text: "Bajumu kuning, pitamu merah." },
  { start: 31, end: 35, text: "Wajahmu cerah buatku terpesona." },
  { start: 36, end: 40, text: "Melati sayang, kamu memang indah." },
  { start: 41, end: 44, text: "Jantungku berdebar (deg-degan)." },
  { start: 45, end: 49, text: "Saat kau menoleh (hai sayang)." },
  { start: 50, end: 57, text: "Glockenspiel berbunyi ting-ting-ting." },
  { start: 60, end: 64, text: "Melati, kau lucuuuu... (Hehe!)" },
  { start: 65, end: 69, text: "Senyummu bikin aku terpanaaa..." },
  { start: 69, end: 78, text: "Melangkah riang ceria, hatiku jadi meleleh." },
  { start: 79, end: 83, text: "Jangan pergi, aku mau..." },
  { start: 84, end: 88, text: "Jadi dekat selalu (selalu ya)." },
  { start: 89, end: 97, text: "Kau.. tersenyum.. lucuuuu..." },
  { start: 98, end: 107, text: "Hatiku.. berbunga.. senanggg..." },
  { start: 108, end: 116, text: "Melati.. manismu… bikin aku ingin selalu dekat." },
  { start: 117, end: 121, text: "Melati, kau lucu." },
  { start: 122, end: 127, text: "Senyummu bikin aku terpana." },
  { start: 128, end: 136, text: "Melangkah riang ceria, hatiku jadi meleleh." },
  { start: 136, end: 145, text: "Melati ceria, kau lucu cantik selalu." },
  { start: 148, end: 157, text: "Hatiku berbunga, kamu melati oh meleleh." }
];

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showMessage, setShowMessage] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeIndex = lyrics.findIndex((l, i) => {
    const nextStart = lyrics[i + 1] ? lyrics[i + 1].start : Infinity;
    return progress >= l.start && progress < nextStart;
  });
  const displayIndex = activeIndex !== -1 ? activeIndex : (progress < lyrics[0].start ? 0 : lyrics.length - 1);

  useEffect(() => {
    if (displayIndex !== -1 && lyricRefs.current[displayIndex]) {
      lyricRefs.current[displayIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [displayIndex]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleCloseMessage = () => {
    setShowMessage(false);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Autoplay prevented by browser:", err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleSkip = (amount: number) => {
    if (audioRef.current) {
      const newTime = Math.min(Math.max(audioRef.current.currentTime + amount, 0), duration);
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      const response = await fetch("https://audio.jukehost.co.uk/Z9GKAxWf7P465mxlBj0svTdCbhdAMCG1.mp3");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "Melati_Ceriaku.mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      window.open("https://audio.jukehost.co.uk/Z9GKAxWf7P465mxlBj0svTdCbhdAMCG1.mp3", "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Floating hearts component
  const FloatingHearts = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-red-400/40"
            initial={{
              y: '100vh',
              x: `${Math.random() * 100}vw`,
              scale: Math.random() * 0.5 + 0.5,
              rotate: Math.random() * 360
            }}
            animate={{
              y: '-20vh',
              rotate: Math.random() * 360 + 360
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
          >
            <Heart size={32} fill="currentColor" />
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col md:items-center md:justify-center overflow-hidden bg-rose-50">
      {/* Background Image */}
      <img
        src="https://imgur.com/l2AjkqN.jpeg"
        alt="Background"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/60 md:bg-white/40 backdrop-blur-sm md:backdrop-blur-[2px] z-10"></div>

      {/* Floating Hearts */}
      {isPlaying && <FloatingHearts />}

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 w-full h-[100dvh] md:h-auto md:max-w-md flex flex-col md:bg-white/80 md:backdrop-blur-xl md:rounded-3xl md:shadow-2xl md:border-2 md:border-red-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-400 to-rose-400 p-6 text-center relative overflow-hidden shrink-0 shadow-md md:shadow-none z-20">
          <button 
            onClick={() => setShowMessage(true)}
            className="absolute left-4 top-4 text-white/80 hover:text-white transition-colors z-30"
            title="Pesan untuk Melati"
          >
            <MessageCircleHeart size={28} />
          </button>
          
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -right-4 -top-4 text-white/20"
          >
            <Music size={100} />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
            Melati Ceriaku
          </h1>
          <div className="text-red-50 font-medium relative z-10 text-sm tracking-wide flex flex-col items-center gap-1.5 mt-1">
            <p className="drop-shadow-sm">Alvia Melina & Avriel Pratama</p>
            <p className="text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/30 shadow-sm">
              Album: Melatiku
            </p>
          </div>
        </div>

        {/* Desktop Vinyl */}
        <div className="hidden md:flex flex-col items-center pt-8 pb-2 shrink-0">
          <motion.div 
            className="w-32 h-32 rounded-full border-4 border-red-100 shadow-lg flex items-center justify-center bg-gradient-to-br from-rose-100 to-red-50 relative overflow-hidden"
            animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div 
              className="w-full h-full rounded-full border-[12px] border-red-400 flex items-center justify-center bg-white"
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Heart className="text-red-400" size={32} fill="currentColor" />
            </motion.div>
          </motion.div>
        </div>

        {/* Lyrics Section */}
        <div className="flex-1 md:flex-none md:h-48 w-full relative lyrics-mask overflow-y-auto scrollbar-hide z-10">
          <div className="py-[35vh] md:py-16 space-y-4 md:space-y-3">
            {lyrics.map((lyric, index) => {
              const isActive = progress >= lyric.start && progress <= lyric.end;
              const isPast = progress > lyric.end;
              
              return (
                <div 
                  key={index}
                  ref={el => { lyricRefs.current[index] = el; }}
                  className={`text-center transition-all duration-300 px-4 ${
                    isActive 
                      ? 'text-red-600 md:text-red-500 font-bold text-xl md:text-lg scale-110 drop-shadow-sm' 
                      : isPast 
                        ? 'text-red-500/60 md:text-red-400/50 text-base md:text-sm' 
                        : 'text-red-500/60 md:text-red-400/50 text-base md:text-sm'
                  }`}
                >
                  {lyric.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Controls (Bottom Sheet on Mobile) */}
        <div className="bg-white/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-t-3xl md:rounded-none p-6 pb-8 md:p-8 flex flex-col items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none shrink-0 border-t border-red-100 md:border-none relative z-20">
          
          {/* Progress Bar */}
          <div className="w-full mb-6">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-red-500 md:text-red-400 mt-2 font-medium">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-center gap-4 md:gap-6 w-full relative mt-2">
            {/* Prev Button */}
            <button 
              onClick={() => handleSkip(-10)} 
              className="w-12 h-12 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Mundur 10 detik"
            >
              <SkipBack size={28} className="fill-current" />
            </button>

            {/* Play Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              className="w-20 h-20 flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full shadow-xl shadow-red-500/30 hover:shadow-red-500/50 transition-shadow shrink-0"
            >
              {isPlaying ? (
                <Pause size={36} className="fill-current" />
              ) : (
                <Play size={36} className="fill-current ml-2" />
              )}
            </motion.button>

            {/* Next Button */}
            <button 
              onClick={() => handleSkip(10)} 
              className="w-12 h-12 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Maju 10 detik"
            >
              <SkipForward size={28} className="fill-current" />
            </button>
            
            {/* Download Button */}
            <button 
              onClick={handleDownload} 
              disabled={isDownloading}
              className="absolute right-0 w-12 h-12 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
              title="Download Lagu"
            >
              {isDownloading ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src="https://audio.jukehost.co.uk/Z9GKAxWf7P465mxlBj0svTdCbhdAMCG1.mp3"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Message Modal */}
      <AnimatePresence>
        {showMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseMessage}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative border-2 border-red-100"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={handleCloseMessage}
                className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
              {isInstallable && !isInstalled && (
                <button 
                  onClick={handleInstallClick}
                  className="absolute left-4 top-4 text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 border border-red-100 shadow-sm"
                >
                  <Download size={12} /> Install App
                </button>
              )}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-400">
                  <Heart size={32} fill="currentColor" />
                </div>
             </div>
<h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Untuk Sang Melati Ceriaku</h2>
<div className="space-y-3 text-gray-600 text-sm leading-relaxed text-center font-medium">
  <p>
    Ada keindahan dalam kesederhanaan, seperti melati yang mekar tanpa harus diumumkan.
  </p>
  <p>
    Lagu ini adalah catatan tentang keceriaan dan kehangatan sang melati, yang mampu membawa suasana ringan dan menyenangkan.
  </p>
  <p>
    Teruslah melangkah dengan riang, karena kehadiran sang melati sudah cukup membuat hari terasa berbeda.
  </p>
  <p className="pt-2 text-red-400 font-bold">
    Dariku,<br/>Yang mengagumi sang melati
  </p>
</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
