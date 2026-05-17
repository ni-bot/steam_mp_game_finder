export interface SseMessage {
  event: string;
  data: string;
}

export function parseSseChunk(buffer: string): {
  messages: SseMessage[];
  rest: string;
} {
  const messages: SseMessage[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim()) continue;
    let event = "message";
    const dataLines: string[] = [];

    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length > 0) {
      messages.push({ event, data: dataLines.join("\n") });
    }
  }

  return { messages, rest };
}

export async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  onMessage: (event: string, data: unknown) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const { messages, rest } = parseSseChunk(buffer);
    buffer = rest;

    for (const msg of messages) {
      onMessage(msg.event, JSON.parse(msg.data));
    }
  }

  if (buffer.trim()) {
    const { messages } = parseSseChunk(`${buffer}\n\n`);
    for (const msg of messages) {
      onMessage(msg.event, JSON.parse(msg.data));
    }
  }
}
