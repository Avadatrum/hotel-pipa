// src/utils/soundPlayer.ts

// Gera um som de notificação usando Web Audio API
export function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Nota 1: Ding!
    playTone(audioContext, 800, 0.1, 0);
    
    // Nota 2: Dong!
    setTimeout(() => {
      playTone(audioContext, 1000, 0.15, 0.1);
    }, 100);
    
    // Nota 3: Ding!
    setTimeout(() => {
      playTone(audioContext, 1200, 0.2, 0.2);
    }, 200);

  } catch (error) {
    console.error('Erro ao tocar som:', error);
  }
}

function playTone(audioContext: AudioContext, frequency: number, duration: number, startTime: number) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
  
  oscillator.start(audioContext.currentTime + startTime);
  oscillator.stop(audioContext.currentTime + startTime + duration);
}

// Som de "campainha" repetitiva para quando aparece o modal
export function playUrgentSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Toca 3 vezes com intervalos
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        playTone(audioContext, 880, 0.15, 0);
        setTimeout(() => playTone(audioContext, 1100, 0.2, 0.15), 150);
      }, i * 400);
    }
  } catch (error) {
    console.error('Erro ao tocar som:', error);
  }
}