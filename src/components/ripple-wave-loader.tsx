"use client"

import { motion } from "framer-motion"

export function RippleWaveLoader() {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="flex space-x-1">
        {[...Array(7)].map((_, index) => (
          <motion.div
            key={index}
            className="h-8 w-2 rounded-full bg-gray-900"
            animate={{
              scaleY: [0.5, 1.5, 0.5],
              scaleX: [1, 0.8, 1],
              translateY: ["0%", "-15%", "0%"],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  )
}
