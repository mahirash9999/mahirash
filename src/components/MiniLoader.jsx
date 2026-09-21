import React from "react";
import { motion } from "framer-motion";

const MiniLoader = ({ message = "Loading" }) => {
  return (
    <div className="mini-loader-wrapper">
      <div className="mini-loader-content">
        {/* Animated ring */}
        <div className="mini-loader-ring-container">
          <svg className="mini-loader-ring" viewBox="0 0 40 40">
            <circle
              className="mini-loader-track"
              cx="20" cy="20" r="16"
              fill="none" strokeWidth="1.5"
            />
            <motion.circle
              className="mini-loader-arc"
              cx="20" cy="20" r="16"
              fill="none" strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="80 100"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
          </svg>
          {/* Center dot pulse */}
          <motion.div
            className="mini-loader-dot"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Label */}
        <motion.p
          className="mini-loader-label"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
};

export default MiniLoader;
