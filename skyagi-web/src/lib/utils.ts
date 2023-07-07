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
        async start(controller) {
            for (const [key, value] of Object.entries(metadata)) {
                const metaDataMsg = JSON.stringify({[key]: value});
                controller.enqueue(`data: ${JSON.stringify(metaDataMsg)}\n\n`);
                sleep(100); // Sleep for 0.1 second
            }

            let totalLen = respMsg.length;
            let chunkSize = 1, start = 0, end = chunkSize;
            const interval = setInterval(() => {
                const encodedData = encoder.encode(respMsg.slice(start, end));
                //controller.enqueue(`data: ${encodedData}\n\n`);
                // Send raw data
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

    /*
    // Create a new ReadableStream
    return new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            const chunkSize = 1; // Adjust the chunk size as per your requirements
            // Split the string into chunks
            for (let i = 0; i < respMsg.length; i += chunkSize) {
                const chunk = respMsg.slice(i, i + chunkSize);
                //controller.enqueue(`data: ${encoder.encode(chunk)}\n\n`);
                controller.enqueue(`data: ${chunk}\n\n`);
                sleep(1000)
            }

          // Close the stream when finished
          controller.close();
        },
    });
    */
}