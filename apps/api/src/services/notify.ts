import { config } from '../config';

export interface SendInviteOptions { roomCode: string; recipients: string[]; type: 'email' | 'sms' }
export async function sendRoomInvite(options: SendInviteOptions): Promise<boolean> {
  if (!config.MOCK_AZURE) throw new Error('Azure notifications are not implemented in this local build');
  console.log(`[MOCK notification] ${options.type}: ${options.recipients.length} recipients; nothing was sent.`);
  return true;
}
