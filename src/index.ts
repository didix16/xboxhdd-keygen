import { Command } from 'commander';
import { EEPROM } from './eeprom';
import { HMAC_SHA1 } from './xboxCrypt';
import copyPaste from 'copy-paste';

const program = new Command();

program
    .version('1.0.0')
    .description('A tool to generate an OG Xbox HDD Key using EEPROM')
    .option('-f, --file <file>', 'Path to the EEPROM file')
    .option('-s, --serial <serial>', 'Serial number of the HDD')
    .option('-m, --model <model>', 'Model of the HDD')
    .option('-c', 'Copy the generated HDD Password to clipboard', false);

program.parse();

const options = program.opts();

if (!options.file || !options.serial || !options.model) {
    program.help();
} else {
    if (options.serial.length > 20) {
        console.error('Serial number must be less or equal than 20 characters!');
        process.exit(1);
    }
    if (options.model.length > 40) {
        console.error('Model must be less or equal than 40 characters!');
        process.exit(1);
    }
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
        hddPass = Buffer.concat([hddPass, Buffer.alloc(32 - hddPass.length, 0)]);
        console.log(`HDD Password HEX String (32bytes, 64 chars): ${hddPass.toString('hex').toUpperCase()}`);
        if (!options.c) {
            process.exit(0);
        }
        copyPaste.copy(hddPass.toString('hex').toUpperCase(), (err) => {
            if (err) {
                console.error(err);
            } else {
                copyPaste.paste((err, content) => {
                    if (err) {
                        console.error(err);
                    } else if (content === hddPass.toString('hex').toUpperCase()) {
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
