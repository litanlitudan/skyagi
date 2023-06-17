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

export async function getResponseStream(metadata: object, respMsg: string) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            for (const [key, value] of Object.entries(metadata)) {
                const metaDataMsg = JSON.stringify({[key]: value});
                controller.enqueue(JSON.stringify(metaDataMsg));
                sleep(1000); // Sleep for 1 second
            }

            let totalLen = respMsg.length;
            let chunkSize = 5, start = 0, end = chunkSize;
            const interval = setInterval(() => {
                const encodedData = encoder.encode(respMsg.slice(start, end));
                controller.enqueue(encodedData);
                start = end;
                end = end + chunkSize >= totalLen ? totalLen : end + chunkSize;
                if (start >= end) {
                    clearInterval(interval);
                    controller.close();
                }
            }, 1000);
        },
    });

    return stream;
}