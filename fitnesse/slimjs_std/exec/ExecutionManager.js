// ExecutionManager.js (ESM)
// TestCodeLoader.js (ESM)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const loadedFixtures = []; // array of module namespace objects

class TestCodeLoader {
  constructor(arrayOfSearchPaths) {
    this.searchPaths = arrayOfSearchPaths;
  }

  loadFile(name, cb) {
    try {
      for (let i = 0; i < this.searchPaths.length; i++) {
        const base = this.searchPaths[i];
        const tsxPath = path.resolve(path.join(base, `${name}.tsx`));
        if (fileExists(tsxPath)) return loadFixture(tsxPath, cb);

        const tsPath = path.resolve(path.join(base, `${name}.ts`));
        if (fileExists(tsPath)) return loadFixture(tsPath, cb);

        const jsPath = path.resolve(path.join(base, `${name}.js`));
        if (fileExists(jsPath)) return loadFixture(jsPath, cb);
      }
      cb(`File not found: ${name}`);
    } catch (e) {
      cb(e);
    }
  }

  make(name, args, cb) {
    if (!args) args = [];

    try {
      const ns = name.split(".");
      let theType;

      // 直近で読み込んだモジュールから優先して探索
      for (let v = 0; v < loadedFixtures.length; v++) {
        theType = loadedFixtures[v][ns[0]];
        for (let i = 1; i < ns.length; i++) {
          if (!theType) break;
          theType = theType[ns[i]];
        }
        if (theType) break;
      }

      if (!theType) return cb(`NO_CLASS ${name}`, null);

      const obj = construct(theType, args);
      cb(null, obj);
    } catch (e) {
      cb(new Error(e), null);
    }

    function construct(T, ctorArgs) {
      if (typeof T !== "function") {
        throw new TypeError(`Not a constructor: ${T}`);
      }
      // これなら ES クラスでも OK。new.target も正しく伝播。
      return Reflect.construct(T, ctorArgs, T);
      // あるいは return new T(...ctorArgs); でも可
    }
  }
}

/* ----------------- helpers (module-private) ----------------- */

function fileExists(file) {
  try {
    fs.accessSync(file, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function loadFixture(file, cb) {
  try {
    // 絶対パスは file:// URL に変換して import するのが確実
    const url = pathToFileURL(file).href;
    loadedFixtures.push(await import(url));
    cb(null);
  } catch (e) {
    cb(new Error(e));
  }
}


export default class ExecutionManager {
  constructor(arrayOfSearchPaths) {
    this._instances = {};
    this._library = []; // [{ name, value }]
    this._symbols = {};

    const testCodeLoader = new TestCodeLoader(arrayOfSearchPaths);

    // 元APIの委譲（this束縛を維持）
    this.makeInstance = testCodeLoader.make.bind(testCodeLoader);
    this.loadFileIntoSandbox = testCodeLoader.loadFile.bind(testCodeLoader);
  }

  setInstance(name, fixture) {
    this._instances[name] = fixture;
  }

  pushToLibrary(name, instance) {
    this._library.push({ name, value: instance });
  }

  getInstance(name) {
    return this._instances[name] || null;
  }

  setSymbol(name, value) {
    this._symbols[name] = value;
  }

  getSymbol(name) {
    return this._symbols[name] || null;
  }

  getSut(instanceName) {
    const instance = this.getInstance(instanceName);
    return hasSutFunction(instance) ? instance.sut() : null;
  }

  getAllSymbolKeys() {
    return Object.keys(this._symbols);
  }

  getLibraryObject(instanceName, funName) {
    for (let i = this._library.length - 1; i >= 0; i--) {
      const item = this._library[i];
      if (item.name === instanceName && item.value?.[funName]) {
        return item.value;
      }
    }
    return null;
  }

  loadSymbolValuesToArguments(args) {
    for (let i = 0; i < args.length; i++) {
      if (args[i]?.toString().indexOf("$") === 0) {
        args[i] = this.getSymbol(args[i].substring(1));
      }
    }
  }
}

/* --- module-private helper --- */
function hasSutFunction(instance) {
  return !!(instance && typeof instance.sut === "function");
}
