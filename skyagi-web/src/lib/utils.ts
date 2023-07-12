export const checkValidity = (data: any) => {
    if (data === null || data.length === 0) {
        return false;
    } else {
        return true;
    }
};

export function sleep(ms: number): void {
    const start = Date.now();
    while (Date.now() - start < ms) { }
}

export async function getResponseStream(metadata: object, respMsg: string) {
    const stream = new ReadableStream({
        async start(controller) {
            for (const [key, value] of Object.entries(metadata)) {
                const metaDataMsg = JSON.stringify({ [key]: value });
                controller.enqueue(`data: ${JSON.stringify(metaDataMsg)}\n\n`);
                sleep(100); // Sleep for 0.1 second
            }
            console.log('respMsg!!!!', respMsg);
            let totalLen = respMsg.length;
            let chunkSize = 1, start = 0, end = chunkSize;
            const interval = setInterval(() => {
                controller.enqueue(`data: ${respMsg.slice(start, end)}\n\n`);
                start = end;
                end = end + chunkSize >= totalLen ? totalLen : end + chunkSize;
                if (start >= end) {
                    clearInterval(interval);
                    controller.close();
                }
            }, 100);
        },
    });

    return stream;
}
