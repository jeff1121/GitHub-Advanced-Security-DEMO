import { config } from '../config';

export interface SendInviteOptions {
  roomCode: string;
  recipients: string[];
  type: 'email' | 'sms';
}

export const sendRoomInvite = async (opts: SendInviteOptions): Promise<boolean> => {
  if (config.MOCK_AZURE) {
    console.log(
      `[MOCK ACS] Sending ${opts.type.toUpperCase()} invite for Room ${opts.roomCode} to:`,
      opts.recipients.join(', ')
    );
    return true;
  }

  // Real ACS implementation placeholder
  return true;
};
