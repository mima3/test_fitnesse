// CallExecutor.js (ESM)
import ExecUtils from "./ExecUtils.js";

const VOID = "/__VOID__/";

const utils = new ExecUtils();

export default class CallExecutor {
  constructor(state) {
    this.state = state;
  }

  call(instructionArgument, cb, symbolNameToAssignTo) {
    const id = instructionArgument[0];
    const instanceName = instructionArgument[2];
    const funName = instructionArgument[3];
    const args = instructionArgument.slice(4) || [];

    let applyOnObject = this.state.getInstance(instanceName);
    let theFunc = applyOnObject ? applyOnObject[funName] : null;

    try {
      if (!theFunc && isOptionalFunction(funName)) {
        return cb([id, VOID]);
      }

      this.state.loadSymbolValuesToArguments(args);

      if (!theFunc) tryToGetSUT.call(this);
      if (!theFunc) tryToGetLibraryObject.call(this);

      if (!applyOnObject) {
        return cb([id, utils.toException(`NO_INSTANCE ${instanceName}`)]);
      }

      if (!theFunc) {
        const cls = applyOnObject?.constructor?.name || "(unknown)";
        return cb([id, utils.toException(`NO_METHOD_IN_CLASS ${funName} ${cls}`)]);
      }

      const funReturn = theFunc.apply(applyOnObject, args);

      if (typeof funReturn === "undefined") {
        return cb([id, VOID]);
      }

      if (!isPromise(funReturn)) {
        if (symbolNameToAssignTo) this.state.setSymbol(symbolNameToAssignTo, funReturn);
        return cb([id, funReturn]);
      }

      funReturn.then(
        (val) => {
          if (symbolNameToAssignTo) this.state.setSymbol(symbolNameToAssignTo, val);
          cb([id, val]);
        },
        (err) => cb([id, utils.toException(err)])
      );
    } catch (e) {
      cb([id, utils.toException(e)]);
    }

    function tryToGetSUT() {
      const systemUnderTest = this.state.getSut(instanceName);
      if (systemUnderTest && systemUnderTest[funName]) {
        theFunc = systemUnderTest[funName];
        applyOnObject = systemUnderTest;
      }
    }

    function tryToGetLibraryObject() {
      const libraryObject = this.state.getLibraryObject(instanceName, funName);
      if (libraryObject) {
        theFunc = libraryObject[funName];
        applyOnObject = libraryObject;
      }
    }
  }

  callAndAssign(instructionArgument, cb) {
    // 元コードは splice(2,1) の配列をそのまま渡していたが、
    // シンボル名は文字列1件なので [0] を取り出すのが正しい。
    const [symbolName] = instructionArgument.splice(2, 1);
    this.call(instructionArgument, cb, symbolName);
  }
}

/* -------- module-private helpers -------- */

function isPromise(obj) {
  return !!(obj && typeof obj.then === "function");
}

function isOptionalFunction(funName) {
  return (
    funName === "beginTable" ||
    funName === "endTable" ||
    funName === "reset" ||
    funName === "execute" ||
    funName === "table"
  );
}
