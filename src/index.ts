import { Command } from 'commander';
import { EEPROM } from './eeprom';
import { HMAC_SHA1 } from './xboxCrypt';
import copyPaste from 'copy-paste';

const program = new Command();

program
    .version('1.0.0')
    .description('A tool to generate an OG Xbox HDD Key using EEPROM')
    .option('-f, --file <file>', 'Path to the EEPROM file')
    .option('-o, --output <output>', 'Output format (hex, bin).', 'hex')
    .option('-s, --serial <serial>', 'Serial number of the HDD')
    .option('-m, --model <model>', 'Model of the HDD');

program.parse();

const options = program.opts();

if (!options.file || !options.serial || !options.model) {
    program.help();
} else {
    try {
        const eeprom = new EEPROM(options.file);
        // TESTS
        /*console.log(
            `Test SHA1: ${
                SHA1.hashString('The quick brown fox jumps over the lazy dog').toString('hex') ===
                '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12'
                    ? 'OK'
                    : 'FAIL'
            }`
        );
        console.log(
            `Test SHA1: ${
                SHA1.hashString('The quick brown fox jumps over the lazy cog').toString('hex') ===
                'de9f2c7fd25e1b3afad3e85a0bd17d9b100db4b3'
                    ? 'OK'
                    : 'FAIL'
            }`
        );
        let rc4Encrypted = RC4.encrypt(Buffer.from('Hello World'), Buffer.from('Key')).toString('hex');
        let rc4Decrypted = RC4.encrypt(Buffer.from(rc4Encrypted, 'hex'), Buffer.from('Key')).toString('utf8');
        console.log(`Test RC4: ${rc4Decrypted === 'Hello World' ? 'OK' : 'FAIL'}`);*/
        console.log(`EEPROM HDD Key: ${eeprom.getHDDKey().toString('hex').toUpperCase()}`);
        console.log(`EEPROM Region: ${eeprom.getRegion()}`);
        console.log(`EEPROM kernel version: ${eeprom.getKernelVersion()}`);
        let hddPass = HMAC_SHA1(eeprom.getHDDKey(), Buffer.from(options.model + options.serial, 'utf8'));
        console.log('HDD Password Bytes (20bytes): ', hddPass);
        console.log(`HDD Password HEX String (20bytes): [${hddPass.toString('hex').toUpperCase()}]`);
        console.log(`HDD Password String (20bytes): [${hddPass.toString('utf8')}]`);
        //console.log(`HDD PASS: [${Buffer.from('883919cb2dd935aa74b06a532222a88a3ab7451b', 'hex').toString()}]`);
        //console.log(`HDD Password (32bytes): ${hddPass}`);
        copyPaste.copy(hddPass.toString(), (err) => {
            if (err) {
                console.error(err);
            } else {
                copyPaste.paste((err, content) => {
                    if (err) {
                        console.error(err);
                    } else if (content === hddPass.toString()) {
                        console.log('HDD Password copied to clipboard!');
                    } else {
                        console.error('Error copying HDD Password to clipboard!');
                    }
                });
            }
        });
    } catch (error) {
        console.error((error as Error).message);
        console.error(error);
    }
}
