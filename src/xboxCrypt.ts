enum XBOXKernelVersion {
    DEBUG,
    RETAIL_FIRST,
    RETAIL_MIDDLE,
    RETAIL_LAST,
}
// SHA1 Implementation
class SHA1 {
    protected h0: number = 0x67452301;
    protected h1: number = 0xefcdab89;
    protected h2: number = 0x98badcfe;
    protected h3: number = 0x10325476;
    protected h4: number = 0xc3d2e1f0;
    private w: number[] = new Array(80);
    private buffer: Buffer = Buffer.alloc(64);
    private bufferIndex: number = 0;
    protected size: number = 0;

    constructor() {
        this.w = new Array(80);
        this.buffer = Buffer.alloc(64);
        this.bufferIndex = 0;
        this.size = 0;
    }

    reset() {
        this.h0 = 0x67452301;
        this.h1 = 0xefcdab89;
        this.h2 = 0x98badcfe;
        this.h3 = 0x10325476;
        this.h4 = 0xc3d2e1f0;
        this.buffer.fill(0);
        this.bufferIndex = 0;
        this.size = 0;
    }

    private processBlock() {
        let a: number = this.h0;
        let b: number = this.h1;
        let c: number = this.h2;
        let d: number = this.h3;
        let e: number = this.h4;

        for (let t = 0; t <= 15; t++) {
            this.w[t] = this.buffer.readUInt32BE(t * 4);
        }

        for (let t = 16; t <= 79; t++) {
            this.w[t] = this.rol(1, this.w[t - 3] ^ this.w[t - 8] ^ this.w[t - 14] ^ this.w[t - 16]);
        }

        for (let t = 0; t <= 19; t++) {
            let temp = (this.rol(5, a) + ((b & c) | (~b & d)) + e + this.w[t] + 0x5a827999) & 0xffffffff;
            e = d;
            d = c;
            c = this.rol(30, b);
            b = a;
            a = temp;
        }

        for (let t = 20; t <= 39; t++) {
            let temp = (this.rol(5, a) + (b ^ c ^ d) + e + this.w[t] + 0x6ed9eba1) & 0xffffffff;
            e = d;
            d = c;
            c = this.rol(30, b);
            b = a;
            a = temp;
        }

        for (let t = 40; t <= 59; t++) {
            let temp = (this.rol(5, a) + ((b & c) | (b & d) | (c & d)) + e + this.w[t] + 0x8f1bbcdc) & 0xffffffff;
            e = d;
            d = c;
            c = this.rol(30, b);
            b = a;
            a = temp;
        }
        for (let t = 60; t <= 79; t++) {
            let temp = (this.rol(5, a) + (b ^ c ^ d) + e + this.w[t] + 0xca62c1d6) & 0xffffffff;
            e = d;
            d = c;
            c = this.rol(30, b);
            b = a;
            a = temp;
        }

        this.h0 = (this.h0 + a) & 0xffffffff;
        this.h1 = (this.h1 + b) & 0xffffffff;
        this.h2 = (this.h2 + c) & 0xffffffff;
        this.h3 = (this.h3 + d) & 0xffffffff;
        this.h4 = (this.h4 + e) & 0xffffffff;

        this.bufferIndex = 0;
    }

    private rol(bits: number, num: number): number {
        return (num << bits) | (num >>> (32 - bits));
    }

    update(data: Buffer): void {
        let dataPos = 0;
        let dataLen = data.length;

        while (dataLen >= 64) {
            data.copy(this.buffer, 0, dataPos, dataPos + 64);
            this.processBlock();
            dataPos += 64;
            dataLen -= 64;
            this.size += 64;
        }

        data.copy(this.buffer, 0, dataPos, dataPos + dataLen);
        this.bufferIndex = dataLen;
        this.size += dataLen;
    }

    digest(): Buffer {
        const totalBits = this.size * 8;

        this.buffer[this.bufferIndex++] = 0x80;

        if (this.bufferIndex > 55) {
            while (this.bufferIndex < 64) {
                this.buffer[this.bufferIndex++] = 0;
            }
            this.processBlock();
            while (this.bufferIndex < 56) {
                this.buffer[this.bufferIndex++] = 0;
            }
        } else {
            while (this.bufferIndex < 56) {
                this.buffer[this.bufferIndex++] = 0;
            }
        }

        this.buffer.writeUInt32BE(Math.floor(totalBits / 0x100000000), 56);
        this.buffer.writeUInt32BE(totalBits & 0xffffffff, 60);

        this.processBlock();

        const result = Buffer.alloc(20);
        result.writeUInt32BE(this.h0 >>> 0, 0);
        result.writeUInt32BE(this.h1 >>> 0, 4);
        result.writeUInt32BE(this.h2 >>> 0, 8);
        result.writeUInt32BE(this.h3 >>> 0, 12);
        result.writeUInt32BE(this.h4 >>> 0, 16);

        return result;
    }

    static hash(data: Buffer, ...extraArgs: any[]): Buffer {
        const sha1 = new SHA1();
        sha1.update(data);
        return sha1.digest();
    }

    static hashString(data: string, ...extraArgs: any[]): Buffer {
        return SHA1.hash(Buffer.from(data, 'utf8'));
    }
}

class XBOXSHA1 extends SHA1 {
    constructor(kernelVersion: XBOXKernelVersion, step: 1 | 2) {
        super();
        switch (kernelVersion) {
            case XBOXKernelVersion.DEBUG:
                if (step === 1) {
                    this.h0 = 0x85f9e51a;
                    this.h1 = 0xe04613d2;
                    this.h2 = 0x6d86a50c;
                    this.h3 = 0x77c32e3c;
                    this.h4 = 0x4bd717a4;
                } else {
                    this.h0 = 0x5d7a9c6b;
                    this.h1 = 0xe1922beb;
                    this.h2 = 0xb82ccdbc;
                    this.h3 = 0x3137ab34;
                    this.h4 = 0x486b52b3;
                }
                break;
            case XBOXKernelVersion.RETAIL_FIRST:
                if (step === 1) {
                    this.h0 = 0x72127625;
                    this.h1 = 0x336472b9;
                    this.h2 = 0xbe609bea;
                    this.h3 = 0xf55e226b;
                    this.h4 = 0x99958dac;
                } else {
                    this.h0 = 0x76441d41;
                    this.h1 = 0x4de82659;
                    this.h2 = 0x2e8ef85e;
                    this.h3 = 0xb256faca;
                    this.h4 = 0xc4fe2de8;
                }
                break;
            case XBOXKernelVersion.RETAIL_MIDDLE:
                if (step === 1) {
                    this.h0 = 0x39b06e79;
                    this.h1 = 0xc9bd25e8;
                    this.h2 = 0xdbc6b498;
                    this.h3 = 0x40b4389d;
                    this.h4 = 0x86bbd7ed;
                } else {
                    this.h0 = 0x9b49bed3;
                    this.h1 = 0x84b430fc;
                    this.h2 = 0x6b8749cd;
                    this.h3 = 0xebfe5fe5;
                    this.h4 = 0xd96e7393;
                }
                break;
            case XBOXKernelVersion.RETAIL_LAST:
                if (step === 1) {
                    this.h0 = 0x8058763a;
                    this.h1 = 0xf97d4e0e;
                    this.h2 = 0x865a9762;
                    this.h3 = 0x8a3d920d;
                    this.h4 = 0x08995b2c;
                } else {
                    this.h0 = 0x01075307;
                    this.h1 = 0xa2f1e037;
                    this.h2 = 0x1186eeea;
                    this.h3 = 0x88da9992;
                    this.h4 = 0x168a5609;
                }
                break;
            default:
                throw new Error('Invalid kernel version');
        }

        this.size = 512 >>> 3;
    }

    update(data: Buffer) {
        super.update(data);
    }

    digest(): Buffer {
        return super.digest();
    }

    static hash(data: Buffer, kernelVersion: XBOXKernelVersion, step: 1 | 2): Buffer {
        const sha1 = new XBOXSHA1(kernelVersion, step);
        sha1.update(data);
        return sha1.digest();
    }

    static hashString(data: string, kernelVersion: XBOXKernelVersion, step: 1 | 2): Buffer {
        return XBOXSHA1.hash(Buffer.from(data, 'utf8'), kernelVersion, step);
    }

    static hashHMACHDDKey(kernelVersion: XBOXKernelVersion, ...buffers: Buffer[]): Buffer {
        const sha1Step1 = new XBOXSHA1(kernelVersion, 1);
        const buffer = Buffer.concat(buffers);
        sha1Step1.update(buffer);
        const step1 = sha1Step1.digest();
        const sha1Step2 = new XBOXSHA1(kernelVersion, 2);
        sha1Step2.update(step1);
        return sha1Step2.digest();
    }
}

class RC4 {
    private s: number[] = new Array(256);
    private i: number = 0;
    private j: number = 0;

    constructor(key: Buffer) {
        for (let i = 0; i < 256; i++) {
            this.s[i] = i;
        }

        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + this.s[i] + key[i % key.length]) & 0xff;
            [this.s[i], this.s[j]] = [this.s[j], this.s[i]];
        }
    }

    update(data: Buffer): Buffer {
        const output = Buffer.alloc(data.length);
        for (let k = 0; k < data.length; k++) {
            this.i = (this.i + 1) & 0xff;
            this.j = (this.j + this.s[this.i]) & 0xff;
            [this.s[this.i], this.s[this.j]] = [this.s[this.j], this.s[this.i]];
            const t = (this.s[this.i] + this.s[this.j]) & 0xff;
            output[k] = data[k] ^ this.s[t];
        }
        return output;
    }

    static encrypt(data: Buffer, key: Buffer): Buffer {
        const rc4 = new RC4(key);
        return rc4.update(data);
    }
}

function HMAC_SHA1(key: Buffer, ...data: Buffer[]): Buffer {
    let k = key;
    if (key.length > 64) {
        k = SHA1.hash(key);
    }

    let sha1: SHA1 = new SHA1();
    let i_key_pad = Buffer.alloc(64);
    let o_key_pad = Buffer.alloc(64 + 20);

    let i;
    for (i = 0x40 - 1; i >= key.length; --i) i_key_pad[i] = 0x36;
    for (; i >= 0; --i) i_key_pad[i] = key[i] ^ 0x36;

    // concat all data
    let dataBuffer = Buffer.concat([i_key_pad, ...data]);
    sha1.update(dataBuffer);
    let innerHash: Buffer = sha1.digest();

    for (i = 0x40 - 1; i >= key.length; --i) o_key_pad[i] = 0x5c;
    for (; i >= 0; --i) o_key_pad[i] = key[i] ^ 0x5c;

    o_key_pad.set(innerHash, 64);

    let sha1Outer: SHA1 = new SHA1();
    sha1Outer.update(o_key_pad);
    return sha1Outer.digest();
}

export { SHA1, XBOXSHA1, XBOXKernelVersion, RC4, HMAC_SHA1 };
