
import pino from "pino";
import { mkdirSync } from "node:fs";

mkdirSync("./logs", { recursive: true });
const transport = pino.transport({
  targets: [
    { target: "pino/file", options: { destination: "./logs/app.jsonl", sync: true } },
    // 標準出力には流さない
    // { target: "pino-pretty", options: { colorize: true } }
  ]
});

export const logger = pino({ level: "info" }, transport);
export const onFinalLog = () => {
  logger.error({}, "uncaught error");
  // transport(=worker) 側も可能なら同期フラッシュして閉じる
  transport.flushSync();
  transport.end();
};