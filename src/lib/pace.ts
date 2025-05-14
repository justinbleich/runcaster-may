// Calculate pace for activities
export function calculatePace(distance: number, duration: number, type: 'run' | 'bike'): string {
  if (distance === 0) return type === 'run' ? '--:--/km' : '--.- km/h';
  
  if (type === 'run') {
    // For running: minutes per kilometer (duration is in minutes)
    const paceMinutes = duration / distance;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  } else {
    // For cycling: kilometers per hour (convert minutes to hours)
    const speed = (distance / duration) * 60;
    return `${speed.toFixed(1)} km/h`;
  }
}

export function calculatePaceFromSeconds(distance: number, durationSeconds: number, type: 'run' | 'bike'): string {
  if (distance === 0) return type === 'run' ? '--:--/km' : '--.- km/h';
  
  if (type === 'run') {
    // For running: minutes per kilometer
    const paceSeconds = durationSeconds / distance;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  } else {
    // For cycling: kilometers per hour
    const speed = (distance / (durationSeconds / 3600));
    return `${speed.toFixed(1)} km/h`;
  }
} 