export const checkValidity = (data: any) => {
    if (data === null || data.length === 0) {
        return false;
    } else {
        return true;
    }
};