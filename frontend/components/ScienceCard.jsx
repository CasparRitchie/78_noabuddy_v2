import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import "./ScienceCard.css";

const ScienceCard = ({ children, index }) => {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: "-40% 0px -40% 0px" });

  return (
    <motion.div
      ref={ref}
      className="science-card"
      style={{ zIndex: 20 - index }}
      initial={{ opacity: 0, y: 80 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScienceCard;
