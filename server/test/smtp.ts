import { createServer } from "node:net";
import type { Socket } from "node:net";

export async function startTestSmtp() {
  const messages: string[] = [];
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});
    socket.write("220 localhost test SMTP\r\n");
    let buffer = "";
    let inData = false;
    let message = "";
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      let end: number;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (inData) {
          if (line === ".") {
            messages.push(message);
            message = "";
            inData = false;
            socket.write("250 Accepted\r\n");
          } else message += `${line}\r\n`;
        } else if (/^EHLO|^HELO/.test(line))
          socket.write("250-localhost\r\n250 SIZE 52428800\r\n");
        else if (line === "DATA") {
          inData = true;
          socket.write("354 Send message\r\n");
        } else if (line === "QUIT") socket.end("221 Bye\r\n");
        else socket.write("250 OK\r\n");
      }
    });
  });
  server.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No test SMTP address");
  return {
    url: `smtp://127.0.0.1:${address.port}`,
    messages,
    close: async () => {
      sockets.forEach((socket) => socket.destroy());
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
