// StatementExecutor.js (ESM)
import ImportExecutor from "./ImportExecutor.js";
import MakeExecutor from "./MakeExecutor.js";
import ExecutionManager from "./ExecutionManager.js";
import CallExecutor from "./CallExecutor.js";
import AssignExecutor from "./AssignExecutor.js";

class SlimHelperLibrary {
  constructor() {
    this.ACTOR_INSTANCE_NAME = "scriptTableActor";
    this._statementExecutor = null;
    this._fixtureStack = [];
  }

  setStatementExecutor(statementExecutor) {
    this._statementExecutor = statementExecutor;
  }

  getStatementExecutor() {
    return this._statementExecutor;
  }

  pushFixture() {
    this._fixtureStack.push(this.getFixture());
  }

  popFixture() {
    const fixture = this._fixtureStack.pop();
    this._statementExecutor.setInstance(this.ACTOR_INSTANCE_NAME, fixture);
  }

  getFixture() {
    return this._statementExecutor.instance(this.ACTOR_INSTANCE_NAME);
  }
}

export default class StatementExecutor {
  constructor(arrayOfSearchPaths) {
    const execManager = new ExecutionManager(arrayOfSearchPaths);

    const importer = new ImportExecutor(execManager);
    const maker = new MakeExecutor(execManager);
    const caller = new CallExecutor(execManager);
    const assigner = new AssignExecutor(execManager);

    addSlimHelperLibrary(this);

    // メソッド参照は this を失わないように bind しておく
    this.import = importer.import.bind(importer);
    this.make = maker.make.bind(maker);
    this.call = caller.call.bind(caller);
    this.callAndAssign = caller.callAndAssign.bind(caller);
    this.assign = assigner.assign.bind(assigner);

    this.setInstance = (name, fixture) => {
      execManager.setInstance(name, fixture);
    };

    this.instance = (name) => {
      return execManager.getInstance(name);
    };

    function addSlimHelperLibrary(executor) {
      const slimHelper = new SlimHelperLibrary();
      slimHelper.setStatementExecutor(executor);
      execManager.pushToLibrary(slimHelper.ACTOR_INSTANCE_NAME, slimHelper);
    }
  }
}
