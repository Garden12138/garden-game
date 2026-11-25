export function createSound() {
  let context;
  let master;
  let noise;
  let enabled = false;
  const voices = new Set();

  function stop() {
    for (const source of voices) source.stop();
    voices.clear();
  }

  function setEnabled(value) {
    enabled = false;
    if (!value) {
      stop();
      return false;
    }
    try {
      if (!context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return false;
        context = new Audio();
        master = context.createGain();
        master.gain.value = 0.24;
        master.connect(context.destination);
        noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.5), context.sampleRate);
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
      if (context.state !== 'running') context.resume().catch(() => {});
      enabled = true;
    } catch {
      enabled = false;
    }
    return enabled;
  }

  function playVoice(source, filter, start, length, volume, pan = 0) {
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
    const nodes = [source, filter, envelope].filter(Boolean);
    if (pan && context.createStereoPanner) {
      const panner = context.createStereoPanner();
      panner.pan.value = pan;
      nodes.push(panner);
    }
    nodes.forEach((node, index) => node.connect(nodes[index + 1] ?? master));
    source.onended = () => {
      voices.delete(source);
      nodes.forEach(node => node.disconnect());
    };
    voices.add(source);
    source.start(start);
    source.stop(start + length + 0.01);
  }

  function tone(at, from, to, length, volume, type = 'sine', pan = 0) {
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, at);
    oscillator.frequency.exponentialRampToValueAtTime(to, at + length);
    playVoice(oscillator, null, at, length, volume, pan);
  }

  function rustle(at, frequency, length, volume, pan) {
    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    playVoice(source, filter, at, length, volume, pan);
  }

  function chime(at) {
    tone(at, 590, 588, 0.61, 0.36);
    tone(at, 1360, 1348, 0.29, 0.18);
    tone(at, 1840, 1835, 0.12, 0.09);
  }

  function bell() {
    if (enabled) chime(context.currentTime);
  }

  function select() {
    if (enabled) tone(context.currentTime, 410, 270, 0.052, 0.13, 'triangle');
  }

  function reveal(result) {
    if (!enabled) return;
    stop();
    const at = context.currentTime;
    tone(at + 0.02, 1320, 1550, 0.105, 0.12);
    for (const [side, choice] of result.choices.entries()) {
      const pan = side === 0 ? -0.42 : 0.42;
      const effect = result.effects[side];
      if (choice.id === 'step' || choice.id === 'jab') {
        const start = result.before?.fighters[side].position;
        const strides = start == null ? 1 : Math.abs(result.footwork[side] - start);
        for (let i = 0; i < strides; i++) {
          const stepAt = at + 0.19 + side * 0.045 + i * 0.21;
          tone(stepAt, 130, 68, 0.085, 0.22, 'triangle', pan);
          rustle(stepAt, 650, 0.065, 0.22, pan);
        }
      }
      if (choice.id === 'dive') rustle(at + 0.42, 1900, 0.32, 0.35, pan);
      const contact = at + 0.93 + side * 0.025;
      if (effect === 'guard') {
        rustle(contact, 2300, 0.09, 0.7, pan);
        tone(contact, 710, 590, 0.14, 0.25, 'triangle', pan);
      } else if (effect === 'hit' || effect === 'clash') {
        const heavy = choice.id === 'throw' || choice.id === 'dive';
        tone(contact, heavy ? 135 : 210, 63, heavy ? 0.25 : 0.1, 0.36, 'triangle', pan);
        rustle(contact, heavy ? 820 : 1800, 0.12, 0.45, pan);
      } else if (effect === 'miss' || effect === 'feint') {
        rustle(contact - 0.08, 1500, 0.14, 0.24, pan);
      }
    }
    if (result.knockdowns.some(Boolean)) {
      tone(at + 1.51, 105, 42, 0.34, 0.57, 'triangle');
      rustle(at + 1.51, 450, 0.25, 0.65, 0);
      chime(at + 1.87);
    }
  }

  return { setEnabled, reveal, select, bell, stop };
}
