export default function(a: number, b?: number): number[] {
    const start = b === undefined ? 0 : a;
    const end = b === undefined ? a : b;

    let generator = function*() {
        let i = start
        while(true) {
            yield i++

            if(i === end) { // stop iterate until the end
                break
            }
        }
    }

    let ret = []
    for(const value of generator()) {
        ret.push(value)
    }

    return ret
}