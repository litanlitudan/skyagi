export const checkValidity = (data: any) => {
    if (data === null || data.length === 0) {
        return false;
    } else {
        return true;
    }
};


export function sleep(ms: number): void {
  const start = Date.now();
  while (Date.now() - start < ms) {}
}