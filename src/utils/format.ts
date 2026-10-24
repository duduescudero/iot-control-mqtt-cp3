export function formatTime(timestamp?: number): string {
  if (timestamp === undefined) return 'Aguardando leitura';
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
export function brokerHost(value: string): string {
  try { return new URL(value).host; } catch { return value; }
}
