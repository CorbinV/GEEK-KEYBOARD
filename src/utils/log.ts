const useLog: boolean = import.meta.env?.VITE_USE_LOG === 'Y';
export function logger(message?: any, ...optionalParams: any[]) {
  if (useLog) {
    console.log(message, optionalParams);
  }
}
