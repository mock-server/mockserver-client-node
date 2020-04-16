const fs = require('fs');
const path = require('path');

const $RefParser = require('@apidevtools/json-schema-ref-parser');
const { compile } = require('json-schema-to-typescript');

const [,, srcPath, newFilePath] = process.argv;

const absPath = path.join(__dirname, srcPath);
const destPath = path.join(__dirname, newFilePath);

const files = fs.readdirSync(absPath);
const definitions = {};

for (const file of files) {
    const nextFile = require(`${absPath}/${file}`);
    const [title] = file.split('.');
    if (nextFile.type) {
        delete nextFile.oneOf;
    }
    definitions[title] = nextFile;
}

$RefParser.dereference({definitions}, (err, schema) => {
    if (err) {
        console.log(err);
    } else {
        compile(schema, 'requiredSchema', {
            unreachableDefinitions: true,
            singleQuote: true,
            trailingComma: true
        }).then(ts => fs.writeFileSync(destPath, ts, 'utf8'));
    }
})



