// ImportExecutor.js (ESM)
import ExecUtils from "./ExecUtils.js";
import { logger } from "../logger.js"
const utils = new ExecUtils();

export default class ImportExecutor {
  constructor(state) {
    this.state = state;
  }

  import(instructionArgument, cb) {
    const id = instructionArgument[0];
    const fileName = instructionArgument[2];
    logger.info(instructionArgument, "import")
    this.state.loadFileIntoSandbox(fileName, (err) => {
      if (err) {
        logger.error(err, "import..error")
        return cb([id, utils.toException(err)]);
      }
      cb([id, "OK"]);
    });
  }
}
