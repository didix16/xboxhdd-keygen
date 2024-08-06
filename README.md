# xboxhdd-keygen

A tool to generate an OG Xbox HDD Key using EEPROM along with HDD serial and model numbers.

# Requirements

-   Node.js (20+). It can be lower, but I haven't tested it
-   npm or yarn or similiar package manager
-   eeprom.bin from an OG Xbox (all versions should work)
-   HDD serial number
-   HDD model number
-   (optinal) If you are on linux, try to install xclip to be able to copy the key to clipboard, else don't use the -c flag

# Installation

```bash
git clone https://github.com/didix16/xboxhdd-keygen.git
cd xboxhdd-keygen
npm install # or yarn or your package manager install command
```

# Usage

```
Usage: index [options]

A tool to generate an OG Xbox HDD Key using EEPROM

Options:
  -V, --version          output the version number
  -f, --file <file>      Path to the EEPROM file
  -s, --serial <serial>  Serial number of the HDD
  -m, --model <model>    Model of the HDD
  -c                     Copy the generated HDD Password to clipboard (default: false)
  -h, --help             display help for command
```

```bash
# on xboxhdd-keygen directory
npm run build # first time only
node dist/index.js -f "path/to/eeprom.bin" -s "HDD SERIAL" -m "HDD MODEL" -c
```
