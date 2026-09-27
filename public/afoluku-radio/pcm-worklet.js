class RadioPCM extends AudioWorkletProcessor {
 constructor(){super();this.buffer=new Float32Array(Math.round(sampleRate));this.index=0;}
 process(inputs){const channels=inputs[0];if(!channels?.length)return true;for(let i=0;i<channels[0].length;i++){let value=0;for(const channel of channels)value+=channel[i]||0;this.buffer[this.index++]=value/channels.length;if(this.index===this.buffer.length){const samples=this.buffer;this.port.postMessage({samples,rate:sampleRate},[samples.buffer]);this.buffer=new Float32Array(Math.round(sampleRate));this.index=0;}}return true;}
}
registerProcessor('radio-pcm',RadioPCM);
