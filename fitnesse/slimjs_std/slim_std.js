#! /usr/bin/env node

import path from "node:path";
import StatementExecutor from "./exec/StatementExecutor.js"
import { logger, onFinalLog } from "./logger.js"
import JSON5 from "json5";

const VERSION_LINE = `Slim -- V0.5\n`;
const BYTES_PAD = 6;
export const BYE = "bye";

const classpath = process.argv[process.argv.length - 2];
const arrayOfSearchPaths = classpath.split(path.delimiter);
const statementExecutor = new StatementExecutor(arrayOfSearchPaths);

const port = parseInt(process.argv[process.argv.length - 1], 10);
logger.info({port, classpath}, "start");


class SlimParser {
  parse(slimString) {
    const json = this.convertSlimStringToJson(slimString);
    logger.info({json, slimString}, "parse")
    return JSON.parse(json);
  }

  stringify(arr) {
    const body = this.arrayToSlim(arr);
    // 本体のUTF-8バイト長 + 角かっこ2文字("[]") = +2
    const result = `${this.pad(Buffer.byteLength(body, "utf8") + 2)}:[${body}]`;
    return result;
  }

  arrayToSlim(arr) {
    let result = `${this.pad(arr.length)}:`;
    for (let i = 0; i < arr.length; i++) {
      let elm = arr[i];
      if (Array.isArray(elm)) {
        const a = this.arrayToSlim(elm);
        result += `${this.pad(a.length + 2)}:[${a}]:`;
      } else {
        elm = elm.toString();
        result += `${this.pad(elm.length)}:${elm}:`;
      }
    }
    return result;
  }

  convertSlimStringToJson(slimString) {
    let result = "[";
    const firstColon = slimString.indexOf(":");
    const numHeader = slimString.substring(2, firstColon);
    const numberOfElementsInArray = parseInt(numHeader);
    // 元の substr(start, length) と等価に、substring(start, end) へ置換（挙動同一）
    slimString = slimString.substring(numHeader.length + 3, slimString.length - 2);

    let cur = 0;
    for (let i = 0; i < numberOfElementsInArray; i++) {
      // ここは「全体先頭からの indexOf(':') を長さとして使う」旧挙動を厳密に踏襲
      const globalColon = slimString.indexOf(":");
      const elmHeader = slimString.substring(cur, cur + globalColon);
      const elmLength = parseInt(elmHeader);
      const start = cur + elmHeader.length + 1;
      const end = start + elmLength;
      const elm = slimString.substring(start, end);

      if (elm[0] === "[") {
        result += this.convertSlimStringToJson(elm) + ",";
      } else {
        result += "" + this.inferValueType(elm) + ",";
      }

      cur += elmHeader.length + elm.length + 2;
    }

    if (result.endsWith(",")) result = result.slice(0, -1);
    result += "]";
    return result;
  }

  pad(num) {
    let s = String(num);
    while (s.length < BYTES_PAD) s = "0" + s;
    return s;
  }

  inferValueType(val) {
    const lower = val.toLowerCase();

    if (lower === "true" || lower === "false") return lower;
    if (this.isNumber(val)) return parseFloat(val);

    if (val.trim().startsWith("{")) {
      try {
        const o = JSON5.parse(val);
        return JSON.stringify(o);
      } catch {
        // JSON5として解釈できなければフォールバックで文字列扱い
      }
    }
    // 文字列：ダブルクォートはエスケープ
    return `"${val.replace(/"/g, '\\"')}"`;
  }

  isNumber(str) {
    return str !== null && str !== "" && !isNaN(str);
  }
}

class SlimStdRunner {
  constructor() {
    this.slimParser = new SlimParser();
  }
  start() {
    process.stdin.resume(); // 明示的に読み取り開始
    process.stdin.setEncoding(null); // Bufferで受ける（バイナリ安全）
    process.stdin.on('error', this.onStdioError);
    process.stdout.on('error', this.onStdioError); // EPIPE 対策（親が先に閉じた時など）
    process.on('uncaughtException', this.onProcessExit);
    process.on("unhandledRejection", this.onProcessExit);
    process.on("SIGINT", () => this.onProcessExit);
    process.on("SIGTERM", () => this.onProcessExit)
    process.stdout.write(VERSION_LINE);
    this.buffer = '';
    process.stdin.on('data', (chunk) => {
      this.buffer += chunk;
      logger.info({chunk, buffer: this.buffer}, "data");
      this.tryConsume();
    });
  }
  onProcessExit() {
    onFinalLog();
    process.exit(1)
  }
  onStdioError(err) {
    logger.error({err}, "onStdioError");
  }
  writeResult(executionResult) {
    logger.info({executionResult}, 'writeResult')
    const slim = this.slimParser.stringify(executionResult);
    process.stdout.write(slim);
  }
  tryConsume() {
    while (true) {
      // 1) 長さヘッダを取り出す（例：10進数字とコロン "123:" 形式を想定）
      const colon = this.buffer.indexOf(':');
      if (colon < 0) return; // ヘッダ未到着

      const lenStr = this.buffer.substring(0, colon).trim();
      if (!/^\d+$/.test(lenStr)) {
        // プロトコルエラー（ログは stderr に出すこと！）
        console.error(`SERR: invalid length header: "${lenStr}"`);
        // 壊れたストリームは終了するなどのポリシーを取る
        process.exitCode = 2;
        return;
      }
      const bodyLen = Number(lenStr);

      // 2) ボディが揃っているか確認
      const totalNeeded = colon + 1 + bodyLen;
      if (this.buffer.length < totalNeeded) return; // まだ足りない

      const body = this.buffer.substring(colon + 1, totalNeeded); // ちょうど bodyLen バイト

      // 3) 次メッセージに向けてバッファを前詰め
      this.buffer = this.buffer.substring(totalNeeded);

      // 4) 受信メッセージを処理
      if (body === BYE) {
        logger.info({body}, 'tryConsume')
        process.exit(0);
      }
      const instructionSet = this.slimParser.parse(body);
      this.handleSlimMessage(instructionSet);
    }
  }
  handleSlimMessage(instructionSet) {
    logger.info({instructionSet}, 'handleSlimMessage')

    const returnValues = [];
    let currentInstructionIndex = 0;
    if (instructionSet === BYE) {
      this.writeResult(returnValues);
      process.exit(0);
    }
    executeInstruction(instructionSet[0], onInstructionExecutionResult);

    const onInstructionExecutionResult = (result) => {
      returnValues.push(result);
      currentInstructionIndex++;

      if (wasLastInstructionExecuted(result)) {
        this.writeResult(returnValues);
      } else {
        executeInstruction(
          instructionSet[currentInstructionIndex],
          onInstructionExecutionResult
        );
      }
    }
    const executeInstruction = (instruction) => {
      logger.info({instruction}, "executeInstruction");
      const command = instruction[1];
      statementExecutor[command](instruction, onInstructionExecutionResult);
    }
    const wasLastInstructionExecuted = (result) => {
      return result === BYE || currentInstructionIndex === instructionSet.length;
    }
  }
}

const runner = SlimStdRunner();
runner.start();
