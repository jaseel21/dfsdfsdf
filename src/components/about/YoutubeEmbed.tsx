// Enhanced YouTube Component with Animations and Custom Controls

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export const YoutubeEmbed = ({ videoId = "YOUR_VIDEO_ID" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlayClick = () => {
    setIsPlaying(true);
  };
  
  return (
    <motion.div 
      className="relative h-80 lg:h-96 rounded-xl overflow-hidden shadow-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      viewport={{ once: true }}
    >
      {!isPlaying ? (
        // Video Thumbnail with Play Button
        <div className="relative w-full h-full">
          {/* Thumbnail Background with actual image */}
          <div className="absolute inset-0">
            <Image
              src="/images/promo-thumb.webp"
              alt="Akode Islamic Centre Promo Video Thumbnail"
              fill
              className="object-cover"
              priority
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          
          {/* Play Button */}
          <motion.button 
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={handlePlayClick}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <motion.div 
              className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-10 h-10 text-indigo-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5.14V19.14L19 12.14L8 5.14Z" fill="currentColor" />
              </svg>
            </motion.div>
          </motion.button>
          
          {/* Video Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-white text-xl font-bold">Akode Islamic Centre: Our Mission</h3>
            <p className="text-white/80 text-sm mt-2">Learn about our commitment to Islamic education and orphan care</p>
          </div>
        </div>
      ) : (
        // YouTube Iframe when playing
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0&modestbranding=1`}
          title="Akode Islamic Centre Mission Video"
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
      
      {/* Decorative Elements */}
      <motion.div 
        className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20"
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.2, 0.3]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <motion.div 
        className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full -ml-16 -mb-16"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
    </motion.div>
  );
};

export default YoutubeEmbed;