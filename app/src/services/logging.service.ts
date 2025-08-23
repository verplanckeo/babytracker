import { appInsights, SeverityLevel } from "./insights";

export const LogLevel = {
  Debug: "debug",
  Information: "info",
  Warning: "warn",
  Error: "err",
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export type ILog = {
  Message: string;
  Level: LogLevel;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data?: any;
  Timestamp?: string;       // ISO string
  Caller?: string;          // e.g. "src/pages/OverView.tsx:42:13"
  Context?: string;         // optional extra tag (feature/module)
};

// ---------- Configuration ----------

type LogConfig = {
  appName?: string;
  /** If true, uses console.groupCollapsed for nicer formatting */
  prettyConsole?: boolean;
  /** Send structured logs somewhere (e.g., POST to your API) */
  remoteSink?: (log: ILog) => void | Promise<void>;
  /** Minimum level to log to console */
  minConsoleLevel?: LogLevel;
  /** Minimum level to send to remote sink */
  minRemoteLevel?: LogLevel;
};

const config: LogConfig = {
  appName: undefined,
  prettyConsole: true,
  remoteSink: async (log) => {
    const severity = toSeverity(log.Level);

    // If it's an Error, emit a proper exception (with stack) for better diagnostics
    if (log.Data instanceof Error) {
      appInsights.trackException({
        exception: log.Data,
        severityLevel: severity,
        properties: {
          message: log.Message,
          caller: log.Caller,
          context: log.Context,
          timestamp: log.Timestamp,
          appName: config.appName,
          // include anything else you routinely care about
        },
      });
    } else {
      // Otherwise, treat as a trace with structured properties
      appInsights.trackTrace({
        message: log.Message,
        severityLevel: severity,
        properties: {
          caller: log.Caller,
          context: log.Context,
          timestamp: log.Timestamp,
          appName: config.appName,
          // app-specific fields:
          hasData: log.Data !== undefined,
          // Avoid massive payloads; small objects/ids are fine. Big blobs -> consider JSON.stringify truncation.
          data: typeof log.Data === "string" ? log.Data : undefined,
        },
      });
    }
  },
  minConsoleLevel: LogLevel.Debug,
  minRemoteLevel: LogLevel.Warning,
};

// ---------- Internals ----------

function toSeverity(level: LogLevel): SeverityLevel {
  switch (level) {
    case LogLevel.Debug:       return SeverityLevel.Verbose;
    case LogLevel.Information: return SeverityLevel.Information;
    case LogLevel.Warning:     return SeverityLevel.Warning;
    case LogLevel.Error:       return SeverityLevel.Error; // or SeverityLevel.Critical if you prefer
  }
}

const levelOrder: Record<LogLevel, number> = {
  [LogLevel.Debug]: 10,
  [LogLevel.Information]: 20,
  [LogLevel.Warning]: 30,
  [LogLevel.Error]: 40,
};

function meetsThreshold(level: LogLevel, min?: LogLevel) {
  if (!min) return true;
  return levelOrder[level] >= levelOrder[min];
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Extract caller frame from stack, skipping this file's frames.
 * Works in Chrome/Edge/Firefox. Node stack formats vary but this is fine for browser apps.
 */
function getCallerLocation(skipFrames = 2): string | undefined {
  const err = new Error();
  if (!err.stack) return undefined;

  const lines = err.stack.split("\n").map(l => l.trim());

  // Typical formats:
  // Chrome: "at functionName (http://host/path/file.ts:line:col)"
  // Firefox: "functionName@http://host/path/file.ts:line:col"
  // We skip frames for getCallerLocation and the wrapper that calls it.
  const start = Math.min(skipFrames, lines.length - 1);

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];

    // Try Chrome-like
    const m1 = line.match(/\((.*):(\d+):(\d+)\)$/);
    if (m1) {
      const [, file, lineNo, colNo] = m1;
      return shortenPath(`${file}:${lineNo}:${colNo}`);
    }

    // Try Firefox-like
    const m2 = line.match(/@(.*):(\d+):(\d+)$/);
    if (m2) {
      const [, file, lineNo, colNo] = m2;
      return shortenPath(`${file}:${lineNo}:${colNo}`);
    }
  }

  return undefined;
}

/** Make long URLs/paths shorter for console readability (keeps tail). */
function shortenPath(s: string, keep = 80): string {
  if (s.length <= keep) return s;
  return "…" + s.slice(s.length - keep);
}

function levelToConsoleMethod(level: LogLevel): "debug" | "info" | "warn" | "error" {
  switch (level) {
    case LogLevel.Debug: return "debug";
    case LogLevel.Information: return "info";
    case LogLevel.Warning: return "warn";
    case LogLevel.Error: return "error";
  }
}

function levelLabel(level: LogLevel) {
  switch (level) {
    case LogLevel.Debug: return "DEBUG";
    case LogLevel.Information: return "INFO";
    case LogLevel.Warning: return "WARN";
    case LogLevel.Error: return "ERROR";
  }
}

function formatPrefix(level: LogLevel, caller?: string) {
  const parts = [nowIso(), levelLabel(level)];
  if (config.appName) parts.push(config.appName);
  if (caller) parts.push(caller);
  return parts.join(" | ");
}

/** Print to console at the correct level. Keep call-site context visible via appended caller info. */
function writeToConsole(log: ILog) {
  if (!meetsThreshold(log.Level, config.minConsoleLevel)) return;

  const method = levelToConsoleMethod(log.Level);
  const prefix = formatPrefix(log.Level, log.Caller);

  // Pretty grouping helps keep the stack readable without losing call site
  if (config.prettyConsole) {
    //console.groupCollapsed(`${prefix} — ${log.Message}`);
    try {
      if (log.Data instanceof Error) {
        // Print both message and stack, preserving the original stack
        if (log.Data.stack) {
          console[method]("Stack:", log.Data.stack);
        } else {          
          console[method](log.Data);
        }
      } else if (log.Data !== undefined) {
        console[method]("Data:", log.Data);
      }
    } finally {
      console.groupEnd();
    }
  } else {
    if (log.Data instanceof Error) {
      console[method](`${prefix} — ${log.Message}`, log.Data, log);
    } else if (log.Data !== undefined) {
      console[method](`${prefix} — ${log.Message}`, log.Data, log);
    } else {
      console[method](`${prefix} — ${log.Message}`, log);
    }
  }
}

async function writeToRemote(log: ILog) {
  if (!config.remoteSink) return;
  if (!meetsThreshold(log.Level, config.minRemoteLevel)) return;

  try {
    await config.remoteSink(log);
  } catch (e) {
    // If remote fails, don't crash the app—report locally
    console.warn("Remote log sink failed:", e);
  }
}

/**
 * Core logger. NOTE: We DO NOT call console.* here.
 * Each public function calls console.* itself to preserve the user's call site in the stack,
 * while we still compute and attach the caller location string using Error().stack parsing.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GetLogObject(level: LogLevel, message: unknown, data?: unknown, context?: string): ILog {
  const caller = getCallerLocation(3); // skip: getCallerLocation -> emit -> public wrapper
  const log: ILog = {
    Level: level,
    Message: String(message),
    Data: data ?? message,
    Timestamp: nowIso(),
    Caller: caller,
    Context: context,
  };

  // Console write must happen in the public wrapper to keep call site,
  // but we still return the structured log for remote sinks here.
  return log;
}

function writeLogging(log: ILog): void {
  writeToConsole(log);
  void writeToRemote(log);
}

// ---------- Public API (preserves call-site) ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LogDebug(message: string | any, data?: any, context?: string): void {
  const log = GetLogObject(LogLevel.Debug, message, data, context);
  writeLogging(log);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LogInfo(message: string | any, data?: any, context?: string): void {
  const log = GetLogObject(LogLevel.Information, message, data, context);
  writeLogging(log);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LogWarn(message: string | any, data?: any, context?: string): void {
  const log = GetLogObject(LogLevel.Warning, message, data, context);
  writeLogging(log);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function LogError(message: string | any, data?: any, context?: string): void {
    const log = GetLogObject(LogLevel.Error, message, data, context);
    writeLogging(log);
}

// ---------- Optional: single structured entry point (kept for compatibility) ----------

export const Log = async (log: ILog): Promise<void> => {
  // Calling console.* here would move the call site to this file,
  // so we only support remote sink via this path.
  await writeToRemote({
    ...log,
    Timestamp: log.Timestamp ?? nowIso(),
    Caller: log.Caller ?? getCallerLocation(3),
  });
};
