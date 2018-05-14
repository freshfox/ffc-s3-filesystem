import * as should from 'should';
import * as path from 'path';
import {S3Filesystem} from '../../app/filesystem/s3_filesystem';
import {createFilesystemTestSuite} from 'ffc-node';

describe('S3Filesystem', function () {

	const fs = new S3Filesystem({
		bucket: process.env.AWS_BUCKET,
		region: process.env.AWS_REGION
	});

	const baseDirectory = `ffc_s3_filesystem`;

	createFilesystemTestSuite(baseDirectory, fs);

	it('should create an upload URL', async () => {

		const date = Date.now();
		const file = path.join(baseDirectory, `test_${date}.txt`);
		const url = fs.getUploadUrl(file);

		should(url).containEql(`https://${process.env.AWS_BUCKET}`);
	});

	it('should create a download URL', async () => {

		const date = Date.now();
		const file = path.join(baseDirectory, `test_${date}.txt`);
		const url = fs.getDownloadUrl(file);

		should(url).containEql(process.env.AWS_BUCKET);

	});

});
