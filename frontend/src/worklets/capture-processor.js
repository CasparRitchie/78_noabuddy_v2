// frontend/src/worklets/capture-processor.js
// Captures mic frames on the audio thread and posts Float32Arrays to main thread.

class CaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.frameSize = (options?.processorOptions?.frameSize) || 1024;
    this.channel = (options?.processorOptions?.channel) || 0;
    this._buffer = new Float32Array(this.frameSize);
    this._offset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channelData = input[this.channel];
    if (!channelData) return true;

    let i = 0;
    while (i < channelData.length) {
      const remaining = this.frameSize - this._offset;
      const toCopy = Math.min(remaining, channelData.length - i);
      this._buffer.set(channelData.subarray(i, i + toCopy), this._offset);
      this._offset += toCopy;
      i += toCopy;

      if (this._offset >= this.frameSize) {
        // Post a copy so we don't mutate the internal buffer
        this.port.postMessage(this._buffer.slice(0));
        this._offset = 0;
      }
    }

    return true; // keep alive
  }
}

registerProcessor('capture-processor', CaptureProcessor);
