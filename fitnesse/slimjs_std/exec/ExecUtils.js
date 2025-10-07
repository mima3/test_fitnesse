// ExecUtils.js (ESM)
export default class ExecUtils {
  toException(e) {
    if (e && e.stack) {
      return `__EXCEPTION__:${String(e.stack)}`;
    }
    // e が文字列や null/undefined の場合も安全に扱う
    const msg = e instanceof Error ? e.toString() : String(e);
    return `__EXCEPTION__:message:<<${msg}>>`;
  }
}
