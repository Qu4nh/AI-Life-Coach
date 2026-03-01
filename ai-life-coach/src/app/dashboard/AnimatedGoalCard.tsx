'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedGoalCardProps {
    children: ReactNode;
    index: number;
    delayOffset?: number;
    className?: string;
    ['data-tour']?: string;
}

export default function AnimatedGoalCard({ children, index, delayOffset = 0.15, className, 'data-tour': dataTour }: AnimatedGoalCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6, delay: index * delayOffset }}
            className={className}
            data-tour={dataTour}
        >
            {children}
        </motion.div>
    );
}
