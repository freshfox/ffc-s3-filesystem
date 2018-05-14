import {inject, injectable} from 'inversify';
import {S3} from 'aws-sdk';
import * as mime from 'mime-types';
import * as stream from 'stream';
import {Readable} from 'stream';
import {IFilesystem} from 'ffc-node';
import {IS3Config, S3Config} from './types';

@injectable()
export class S3Filesystem implements IFilesystem {

	private s3Client: S3;

	constructor(@inject(S3Config) private config: IS3Config) {
		this.s3Client = new S3({
			apiVersion: '2006-03-01',
			region: config.region,
			params: {
				Bucket: config.bucket
			}
		} as any);
	}

	createReadStream(path: string) {
		return this.s3Client.getObject({
			Key: path,
			Bucket: this.config.bucket
		}).createReadStream();
	}

	createWriteStream(path: string, options?) {
		const s = new stream.PassThrough();
		this.writeStreamToFile(path, s, options)
			.catch((err) => {
				console.error('Error writing stream');
				throw err;
			});
		return s;
	}

	async readFile(path: string, encoding?: string) {
		const resp = await this.s3Client.getObject({
			Key: path,
			Bucket: this.config.bucket,
			ResponseContentEncoding: encoding,
		}).promise();
		if (encoding === 'utf8') {
			return resp.Body.toString();
		}
		return resp.Body as Buffer;
	}

	async exists(path: string): Promise<boolean> {
		try {
			await this.s3Client.headObject({
				Key: path,
				Bucket: this.config.bucket
			}).promise();
		} catch(err) {
			if (err && err.code === 'NotFound') {
				return false;
			}
			throw err;
		}
		return true;
	}

	async unlink(path: string) {
		await this.s3Client.deleteObject({
			Key: path,
			Bucket: this.config.bucket
		}).promise()
	}

	mkdir(path: string): Promise<void> {
		return Promise.resolve();
	}

	async writeStreamToFile(path: string, stream: Readable, options?) {
		const file = await this.s3Client.upload({
			Key: path,
			Body: stream,
			ContentDisposition: 'inline;',
			ContentType: mime.lookup(path),
			Bucket: this.config.bucket
		}).promise();
		return file.Location;
	}

	getUploadUrl(path: string): string {
		return this.s3Client.getSignedUrl('putObject', {
			Bucket: this.config.bucket,
			Key: path,
			Expires: this.config.uploadUrlExpireSeconds || (60 * 10)
		});
	}

	getDownloadUrl(path) {
		let region = this.config.region;
		let bucket = this.config.bucket;
		return `https://s3.${region}.amazonaws.com/${bucket}/${path}`;
	}

}
