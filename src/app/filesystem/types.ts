
export interface IS3Config {
	bucket: string,
	region: string,
	uploadUrlExpireSeconds? : number
}

export const S3Config = Symbol('S3Config');
