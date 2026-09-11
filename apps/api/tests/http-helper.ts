import http from 'node:http';
import { AddressInfo } from 'node:net';
import { createApp } from '../src/app';

export async function httpTestServer() {
  const server = http.createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
}
