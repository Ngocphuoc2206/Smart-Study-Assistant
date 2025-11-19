export const log = (...args: any) => {
    console.log("[LOG]", ...args);
}

// Error
export const logError = (...args: any) => {
    console.error("[ERROR]", ...args);
}

// Warn
export const logWarn = (...args: any) => {
    console.warn("[WARN]", ...args);
}

//Info
export const logInfo = (...args: any) => {
    console.info("[INFO]", ...args);
}

// Debug
export const logDebug = (...args: any) => {
    console.debug("[DEBUG]", ...args);
}

//Trace
export const logTrace = (...args: any) => {
    console.trace("[TRACE]", ...args);
}