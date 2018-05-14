import 'reflect-metadata'
import *  as env from 'node-env-file';
import * as fs from 'fs';
import * as path from 'path'

const envFile = path.join(__dirname, '/../../.env');
if(fs.existsSync(envFile)){
	env(envFile);
}
