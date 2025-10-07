// MakeExecutor.js (ESM)
import ExecUtils from "./ExecUtils.js";
const utils = new ExecUtils();

export default class MakeExecutor {
  constructor(state) {
    this.state = state;
  }

  make(instructionArgument, cb) {
    const state = this.state;

    const id = instructionArgument[0];
    const instance = instructionArgument[2];
    let clazz = instructionArgument[3];

    // "$X" のようにシンボル1個だけを指す場合
    if (classIsSingleSymbol(clazz)) {
      const symbol = state.getSymbol(clazz.substring(1));
      if (typeof symbol !== "string") {
        state.setInstance(instance, symbol);
        return cb([id, "OK"]);
      }
    }

    // クラス名中の $SYMBOL をすべて展開
    clazz = replaceAllSymbols(clazz, state);

    const args = instructionArgument.slice(4);
    state.loadSymbolValuesToArguments(args);

    state.makeInstance(clazz, args, (err, obj) => {
      if (err) return cb([id, utils.toException(err)]);

      if (isLibraryObject(instance)) {
        state.pushToLibrary(instance, obj);
      } else {
        state.setInstance(instance, obj);
      }
      cb([id, "OK"]);
    });
  }
}

/* ------------ helpers (module private) ------------ */

function isLibraryObject(name) {
  return name.indexOf("library") === 0;
}

function classIsSingleSymbol(clazz) {
  // 元コードの意図を尊重してバグを補正:
  // clazz が先頭のみ '$' を含み、全体で '$' が1個だけ
  return clazz.indexOf("$") === 0 && (clazz.match(/\$/g) || []).length === 1;
}

function replaceAllSymbols(clazz, state) {
  if (!needToReplaceSymbols(clazz)) return clazz;

  const symbolKeys = state.getAllSymbolKeys();
  for (let i = 0; i < symbolKeys.length; i++) {
    const key = symbolKeys[i];
    const symbol = state.getSymbol(key);

    if (typeof symbol === "string") {
      const regex = new RegExp(`\\$${key}`, "g");
      clazz = clazz.replace(regex, symbol);
    }
  }
  return clazz;
}

function needToReplaceSymbols(clazz) {
  return clazz.indexOf("$") !== -1;
}
