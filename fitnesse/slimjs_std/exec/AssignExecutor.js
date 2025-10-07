// AssignExecutor.js (ESM)
export default class AssignExecutor {
  constructor(state) {
    this.state = state;
  }

  assign(instructionArguments, cb) {
    const id = instructionArguments[0];
    const symbol = instructionArguments[2];
    const val = instructionArguments[3];

    this.state.setSymbol(symbol, val);
    cb([id, "OK"]);
  }
}
