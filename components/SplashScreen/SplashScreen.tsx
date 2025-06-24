"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [stage, setStage] = useState<"initial" | "expanding" | "complete" | "fadeout">("initial")
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [particles, setParticles] = useState<Array<{
    id: number
    size: number
    initialX: number
    initialY: number
    targetX: number
    targetY: number
    duration: number
    delay: number
  }>>([])

  useEffect(() => {
    // Set window size and generate particles after mount to avoid SSR issues
    const width = window.innerWidth
    const height = window.innerHeight
    setWindowSize({ width, height })
    
    // Generate particle data
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      initialX: Math.random() * width,
      initialY: Math.random() * height,
      targetX: Math.random() * width,
      targetY: Math.random() * height,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 2
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    const timer1 = setTimeout(() => setStage("expanding"), 500)
    const timer2 = setTimeout(() => setStage("complete"), 1300)
    const timer3 = setTimeout(() => setStage("fadeout"), 2500)
    const timer4 = setTimeout(() => onComplete(), 3000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      {stage !== "fadeout" && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute bg-white/5 rounded-full blur-sm"
                style={{
                  width: particle.size,
                  height: particle.size,
                }}
                initial={{
                  x: particle.initialX,
                  y: particle.initialY,
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  x: particle.targetX,
                  y: particle.targetY,
                  scale: [0, 1, 1, 0],
                  opacity: [0, 0.2, 0.2, 0]
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear",
                  delay: particle.delay
                }}
              />
            ))}
          </div>
          
          {/* Subtle grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
          
          {/* Animated gradient overlay - monochrome */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Main content */}
          <div className="relative z-10">
            {/* Initial CAA display */}
            {stage === "initial" && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                className="text-8xl font-bold bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent tracking-wider"
                style={{
                  textShadow: "0 0 40px rgba(255, 255, 255, 0.5), 0 0 80px rgba(255, 255, 255, 0.3)",
                  filter: "drop-shadow(0 0 30px rgba(255, 255, 255, 0.4))"
                }}
              >
                CAA
              </motion.div>
            )}

            {/* Expanding animation */}
            {stage === "expanding" && (
              <motion.div className="flex items-center justify-center gap-2">
                <motion.span
                  initial={{ scale: 1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-6xl font-bold text-white"
                  style={{
                    textShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  C
                </motion.span>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <span className="text-4xl font-medium text-zinc-300">hinami's</span>
                </motion.div>
                <motion.span
                  initial={{ marginLeft: 0 }}
                  animate={{ marginLeft: "0.5rem" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-6xl font-bold text-white"
                  style={{
                    textShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  A
                </motion.span>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <span className="text-4xl font-medium text-zinc-300">nalysis</span>
                </motion.div>
                <motion.span
                  initial={{ marginLeft: 0 }}
                  animate={{ marginLeft: "0.5rem" }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-6xl font-bold text-white"
                  style={{
                    textShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  APP
                </motion.span>
              </motion.div>
            )}

            {/* Complete state */}
            {stage === "complete" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <h1 className="text-5xl font-bold bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent mb-4">
                  Chinami's Analysis APP
                </h1>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-1 bg-gradient-to-r from-zinc-600 via-white to-zinc-600 rounded-full"
                />
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mt-4 text-lg text-zinc-400"
                >
                  Advanced Data Analysis & Visualization
                </motion.p>
                
                {/* Loading indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="mt-8 flex items-center justify-center gap-2"
                >
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}