// frontend/src/components/Waveform.jsx
import React, { useRef, useEffect } from 'react';
import './Waveform.css';

export default function Waveform({ analyser, color = '#000' }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!analyser) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY);
      const angleStep = (Math.PI * 2) / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255;
        const radius = maxRadius * v;
        const angle = i * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      requestAnimationFrame(draw);
    };

    draw();
  }, [analyser, color]);

  return <canvas ref={canvasRef} className="waveform-canvas" />;
}
