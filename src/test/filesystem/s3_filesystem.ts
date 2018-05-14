import * as should from 'should';
import * as path from 'path';
import {S3Filesystem} from '../../app/filesystem/s3_filesystem';
import {Writable} from "stream";

describe('S3Filesystem', function () {

	const fs = new S3Filesystem({
		bucket: process.env.AWS_BUCKET,
		region: process.env.AWS_REGION
	});

	const baseDirectory = `ffc_s3_filesystem`;
	function createPath(...paths) {
		return path.join(baseDirectory, ...paths);
	}

	it('should write a file and check if it exists', async () => {

		const date = Date.now();
		const path = createPath(`test_${date}.txt`);
		const stream = await fs.createWriteStream(path);
		stream.write('ms' + date);
		stream.end();
		await awaitWriteFinish(stream);
		await wait(100);

		const exists = await fs.exists(path);
		should(exists).true();
	});

	it('should write and read a file', async () => {

		const date = Date.now();
		const path = createPath(`test_${date}.txt`);
		const stream = await fs.createWriteStream(path);
		stream.write('Now: ');
		stream.write(date + '');
		stream.end();
		await awaitWriteFinish(stream);
		await wait(100);

		const content = await fs.readFile(path, 'utf8');
		should(content).type('string');
		should(content).eql('Now: ' + date);
	});

	it('should create and delete a file', async () => {

		const date = Date.now();
		const path = createPath(`test_${date}.txt`);

		should(await fs.exists(path)).false();

		const stream = await fs.createWriteStream(path);
		stream.write('test');
		stream.end();
		await awaitWriteFinish(stream);
		await wait(200);

		should(await fs.exists(path)).true();
		await fs.unlink(path);
		await wait(100);
		should(await fs.exists(path)).false();

	});

	it('should create an upload URL', async () => {

		const date = Date.now();
		const path = createPath(`test_${date}.txt`);
		const url = fs.getUploadUrl(path);

		should(url).containEql(`https://${process.env.AWS_BUCKET}`);
	});

	it('should create a download URL', async () => {

		const date = Date.now();
		const path = createPath(`test_${date}.txt`);
		const url = fs.getDownloadUrl(path);

		should(url).containEql(process.env.AWS_BUCKET);

	});

});

function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	});
}


function awaitWriteFinish(stream: Writable) {
	return new Promise((resolve, reject) => {
		stream.on('finish', resolve);
		stream.on('error', reject)
	});
}
