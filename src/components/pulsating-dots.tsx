"use client"

import { motion } from "framer-motion"

export function PulsatingDots() {
  return (
    <div className="flex items-center justify-center">
      <div className="flex space-x-2">
        {[0, 0.3, 0.6].map((delay, i) => (
          <motion.div
            key={i}
            className="h-3 w-3 rounded-full bg-red-500"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              repeat: Infinity,
              delay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
