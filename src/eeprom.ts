import { readFileSync, existsSync } from 'node:fs';
import { RC4, XBOXKernelVersion, XBOXSHA1 } from './xboxCrypt';

/**
 * //Structure that holds contents of 256 byte EEPROM image..
typedef struct _EEPROMDATA {
   BYTE		HMAC_SHA1_Hash[20];			// 0x00 - 0x13 HMAC_SHA1 Hash
   BYTE		Confounder[8];				// 0x14 - 0x1B RC4 Encrypted Confounder ??
   BYTE		HDDKkey[16];				// 0x1C - 0x2B RC4 Encrypted HDD key
   BYTE		XBERegion[4];				// 0x2C - 0x2F RC4 Encrypted Region code (0x01 North America, 0x02 Japan, 0x04 Europe)

   BYTE		Checksum2[4];				// 0x30 - 0x33 Checksum of next 44 bytes
   unsigned char	SerialNumber[12];			// 0x34 - 0x3F Xbox serial number 
   BYTE		MACAddress[6];				// 0x40 - 0x45 Ethernet MAC address
   BYTE		UNKNOWN2[2];			    // 0x46 - 0x47  Unknown Padding ?

   BYTE		OnlineKey[16];				// 0x48 - 0x57 Online Key ?

   BYTE		VideoStandard[4];			// 0x58 - 0x5B  ** 0x00014000 = NTSC, 0x00038000 = PAL
   
   BYTE		UNKNOWN3[4];			    // 0x5C - 0x5F  Unknown Padding ?
   
  
   //Comes configured up to here from factory..  everything after this can be zero'd out...
   //To reset XBOX to Factory settings, Make checksum3 0xFFFFFFFF and zero all data below (0x64-0xFF)
   //Doing this will Reset XBOX and upon startup will get Language & Setup screen...
   BYTE		Checksum3[4];				// 0x60 - 0x63  other Checksum of next  

   BYTE		TimeZoneBias[4];			// 0x64 - 0x67 Zone Bias?
   unsigned char	TimeZoneStdName[4];			// 0x68 - 0x6B Standard timezone
   unsigned char	TimeZoneDltName[4];			// 0x5C - 0x6F Daylight timezone
   BYTE		UNKNOWN4[8];				// 0x70 - 0x77 Unknown Padding ?
   BYTE		TimeZoneStdDate[4];		    // 0x78 - 0x7B 10-05-00-02 (Month-Day-DayOfWeek-Hour) 
   BYTE		TimeZoneDltDate[4];		    // 0x7C - 0x7F 04-01-00-02 (Month-Day-DayOfWeek-Hour) 
   BYTE		UNKNOWN5[8];				// 0x80 - 0x87 Unknown Padding ?
   BYTE		TimeZoneStdBias[4];			// 0x88 - 0x8B Standard Bias?
   BYTE		TimeZoneDltBias[4];			// 0x8C - 0x8F Daylight Bias?

   BYTE		LanguageID[4];				// 0x90 - 0x93 Language ID
  
   BYTE		VideoFlags[4];				// 0x94 - 0x97 Video Settings
   BYTE		AudioFlags[4];				// 0x98 - 0x9B Audio Settings
  
   BYTE		ParentalControlGames[4];	// 0x9C - 0x9F 0=MAX rating
   BYTE		ParentalControlPwd[4];		// 0xA0 - 0xA3 7=X, 8=Y, B=LTrigger, C=RTrigger
   BYTE		ParentalControlMovies[4];   // 0xA4 - 0xA7 0=Max rating
  
   BYTE		XBOXLiveIPAddress[4];		// 0xA8 - 0xAB XBOX Live IP Address..
   BYTE		XBOXLiveDNS[4];				// 0xAC - 0xAF XBOX Live DNS Server..
   BYTE		XBOXLiveGateWay[4];			// 0xB0 - 0xB3 XBOX Live Gateway Address..
   BYTE		XBOXLiveSubNetMask[4];		// 0xB4 - 0xB7 XBOX Live Subnet Mask..
   BYTE		OtherSettings[4];			// 0xA8 - 0xBB Other XBLive settings ?

   BYTE		DVDPlaybackKitZone[4];		// 0xBC - 0xBF DVD Playback Kit Zone

   BYTE		UNKNOWN6[64];				// 0xC0 - 0xFF Unknown Codes / History ?
} EEPROMDATA, *LPEEPROMDATA;
 */
class EEPROM {
    private eeprom: Buffer;
    private decripted: boolean = false;
    protected kernelVersion: string = 'UNKOWN';

    constructor(eepromFilepath: string) {
        if (!existsSync(eepromFilepath)) {
            throw new Error('EEPROM file not found');
        }

        const data = readFileSync(eepromFilepath);
        if (data.length !== 256) {
            throw new Error('Invalid EEPROM file');
        }

        this.eeprom = data;
        this.decryptBoot();
    }

    public decryptBoot(): boolean {
        let RC4KeyHash: Buffer;
        let dataHashConfirm: Buffer;

        for (let version = XBOXKernelVersion.DEBUG; version <= XBOXKernelVersion.RETAIL_LAST; version++) {
            //console.debug(`Trying version ${XBOXKernelVersion[version]}`);
            // Calculate the Key-Hash
            RC4KeyHash = XBOXSHA1.hashHMACHDDKey(version, this.eeprom.subarray(0, 0x14));

            // decrypt data (from eeprom) with the calculated key
            let decryptedEeprom = RC4.encrypt(this.eeprom.subarray(20, 48), RC4KeyHash);

            let region = decryptedEeprom.readUInt32LE(24);
            // Calculate the Confirm-Hash
            dataHashConfirm = XBOXSHA1.hashHMACHDDKey(
                version,
                decryptedEeprom.subarray(0, 8),
                decryptedEeprom.subarray(8, 28)
            );

            let fail = false;
            for (let i = 0; i < 0x14; i++) {
                if (dataHashConfirm[i] != this.eeprom[i]) {
                    fail = true;
                    break;
                }
            }

            if (!fail) {
                // Confirm Hash is correct
                // Copy actual Xbox Version
                switch (version) {
                    case XBOXKernelVersion.DEBUG:
                        this.kernelVersion = 'Debug & Chihiro';
                        break;
                    case XBOXKernelVersion.RETAIL_FIRST:
                        this.kernelVersion = '1.0 (first retail)';
                        break;
                    case XBOXKernelVersion.RETAIL_MIDDLE:
                        this.kernelVersion = '1.1 - 1.4 (middle retail)';
                        break;
                    case XBOXKernelVersion.RETAIL_LAST:
                        this.kernelVersion = '1.6 (last retail)';
                        break;
                    default:
                        this.kernelVersion = 'Unknown';
                }
                this.decripted = true;

                // copy back the decrypted data to the eeprom
                this.eeprom.set(decryptedEeprom, 20);

                break;
            }
        }
        return this.decripted;
    }

    public getKernelVersion(): string {
        return this.kernelVersion;
    }

    public getRegion(): string {
        if (!this.decripted) {
            throw new Error('EEPROM not decrypted');
        }

        let regionData = this.eeprom.readUint32LE(0x2c);
        let region = 'Unknown';
        switch (regionData) {
            case 0x01:
                region = 'North America';
                break;
            case 0x02:
                region = 'Japan';
                break;
            case 0x04:
                region = 'Europe';
                break;
        }
        return region;
    }

    public getHDDKey(): Buffer {
        if (!this.decripted) {
            throw new Error('EEPROM not decrypted');
        }

        return this.eeprom.subarray(28, 28 + 16);
    }
}

export { EEPROM };
