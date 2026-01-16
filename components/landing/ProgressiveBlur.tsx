"use client";

import React, { useRef } from "react";
import {
    motion,
    useScroll,
    useTransform,
    MotionValue,
} from "framer-motion";

interface ProgressiveBlurProps {
    children: React.ReactNode;
    className?: string;
    /**
     * The maximum blur value in pixels when fully scrolled past
     */
    maxBlur?: number;
    /**
     * Whether to apply blur when scrolling down (content goes out of view)
     */
    blurOnExit?: boolean;
    /**
     * Whether to apply blur before entering view (content coming into view)
     */
    blurOnEntry?: boolean;
    /**
     * The scroll range for the blur effect (0-1)
     * Higher values mean the effect happens over a larger scroll distance
     */
    blurRange?: number;
    /**
     * Optional delay for staggered animations
     */
    delay?: number;
}

export function ProgressiveBlur({
    children,
    className = "",
    maxBlur = 10,
    blurOnExit = true,
    blurOnEntry = true,
    blurRange = 0.3,
    delay = 0,
}: ProgressiveBlurProps) {
    const ref = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    // Create blur effect based on scroll position
    // 0 = element is at bottom of viewport (entering)
    // 0.5 = element is in the middle of viewport (fully visible)
    // 1 = element is at top of viewport (exiting)

    const blurValue = useTransform(scrollYProgress, (progress) => {
        let blur = 0;

        if (blurOnEntry && progress < blurRange) {
            // Less progress = less blur when entering (0 to blurRange)
            // Blur increases as we get closer to full visibility
            blur = maxBlur * (progress / blurRange);
        } else if (blurOnExit && progress > 1 - blurRange) {
            // Less remaining progress = less blur when exiting (1-blurRange to 1)
            // Blur decreases as we scroll further out
            blur = maxBlur * (1 - (progress - (1 - blurRange)) / blurRange);
        }

        return `blur(${blur}px)`;
    });

    const opacityValue = useTransform(scrollYProgress, (progress) => {
        let opacity = 1;

        if (blurOnEntry && progress < blurRange) {
            opacity = 0.3 + 0.7 * (progress / blurRange);
        } else if (blurOnExit && progress > 1 - blurRange) {
            opacity = 1 - 0.7 * ((progress - (1 - blurRange)) / blurRange);
        }

        return opacity;
    });

    const scaleValue = useTransform(scrollYProgress, (progress) => {
        let scale = 1;

        if (blurOnEntry && progress < blurRange) {
            scale = 0.98 + 0.02 * (progress / blurRange);
        } else if (blurOnExit && progress > 1 - blurRange) {
            scale = 1 - 0.02 * ((progress - (1 - blurRange)) / blurRange);
        }

        return scale;
    });

    return (
        <motion.div
            ref={ref}
            className={className}
            style={{
                filter: blurValue,
                opacity: opacityValue,
                scale: scaleValue,
            }}
            initial={{ opacity: 0, filter: `blur(${maxBlur}px)` }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: delay * 0.1 }}
        >
            {children}
        </motion.div>
    );
}

/**
 * A wrapper component that applies progressive blur to the entire page
 * as the user scrolls, creating a depth-of-field effect
 */
export function ProgressiveBlurContainer({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();

    // Create a subtle parallax blur effect for the entire container
    const backdropBlur = useTransform(
        scrollYProgress,
        [0, 1],
        ["blur(0px)", "blur(2px)"]
    );

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Subtle gradient overlay that intensifies on scroll */}
            <motion.div
                className="pointer-events-none fixed inset-0 z-[1]"
                style={{
                    background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.02) 50%, transparent 100%)",
                }}
            />
            {children}
        </div>
    );
}

export default ProgressiveBlur;
