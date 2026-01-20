import { s3Configuration } from '@app/configuration';
import { Injectable, Logger } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);

	private readonly s3: S3;

	private readonly bucketName: string;

	private readonly publicRootUrl: string;

	constructor() {
		this.s3 = new S3({
			endpoint: s3Configuration.endpoint,
			region: 'us-east-1', // Workaround: https://github.com/aws/aws-sdk-js-v3/issues/1845
			credentials: {
				accessKeyId: s3Configuration.accessKeyId,
				secretAccessKey: s3Configuration.secretAccessKey,
			},
			forcePathStyle: s3Configuration.endpoint.startsWith('http://localhost'),
		});

		this.bucketName = s3Configuration.bucketName;

		const publicRoot = s3Configuration.publicRootUrl;
		this.publicRootUrl = publicRoot.endsWith('/') ? publicRoot : `${publicRoot}/`;
	}

	getUrl(path: string): string {
		return `${this.publicRootUrl}${this.normalizePath(path)}`;
	}

	async uploadFile(path: string, buffer: Buffer, mimetype: string): Promise<void> {
		try {
			await this.s3.putObject({
				Bucket: this.bucketName,
				ACL: 'public-read',
				ContentType: mimetype,
				ContentDisposition: 'inline',
				CacheControl: 'max-age=31536000', // cache for one year
				Body: buffer,
				Key: this.normalizePath(path),
			});
		} catch (e) {
			if (e instanceof Error) {
				this.logger.error(e.message, e.stack);
			} else {
				this.logger.error(e);
			}

      throw e;
		}
	}

	async deleteFile(path: string): Promise<void> {
		try {
			await this.s3.deleteObject({
				Bucket: this.bucketName,
				Key: this.normalizePath(path),
			});
		} catch (e) {
			if (e instanceof Error) {
				this.logger.error(e.message, e.stack);
			} else {
				this.logger.error(e);
			}

      throw e;
		}
	}

	async downloadFile(path: string): Promise<Buffer> {
		try {
			const response = await this.s3.getObject({
				Bucket: this.bucketName,
				Key: this.normalizePath(path),
			});

			if (!response.Body) {
				throw new Error('Empty response body');
			}

			if (response.Body instanceof Buffer) {
				return response.Body;
			}

			if (response.Body instanceof Uint8Array) {
				return Buffer.from(response.Body);
			}

			if ('transformToByteArray' in response.Body) {
				const bytes = await response.Body.transformToByteArray();
				return Buffer.from(bytes);
			}

			return new Promise((resolve, reject) => {
				const chunks: Buffer[] = [];
				(response.Body as Readable)
					.on('data', (chunk: Buffer) => chunks.push(chunk))
					.on('end', () => resolve(Buffer.concat(chunks)))
					.on('error', reject);
			});
		} catch (e) {
			if (e instanceof Error) {
				this.logger.error(e.message, e.stack);
			} else {
				this.logger.error(e);
			}

			throw e;
		}
	}

	async fileExists(path: string): Promise<boolean> {
		try {
			await this.s3.headObject({
				Bucket: this.bucketName,
				Key: this.normalizePath(path),
			});
			return true;
		} catch (e) {
			const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
			if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound' || err?.name === 'NoSuchKey') {
				return false;
			}

			if (e instanceof Error) {
				this.logger.error(e.message, e.stack);
			} else {
				this.logger.error(e);
			}

			throw e;
		}
	}

	private normalizePath(path: string): string {
		return path.startsWith('/') ? path.substring(1) : path;
	}
}
