import got from 'got';
import { expect } from 'chai';
import { waitMeasurementFinish } from '../utils.js';

describe('mtr measurement', () => {
	it('should finish successfully', async () => {
		const { id } = await got.post('http://localhost:80/v1/measurements', {
			json: {
				target: 'www.jsdelivr.com',
				type: 'mtr',
			},
		}).json<any>();

		const response = await waitMeasurementFinish(id);

		expect(response.body.status).to.equal('finished');
		expect(response.body.results[0].result.status).to.equal('finished');
		expect(response.body.results[0].result.hops.length).to.be.above(0);
		expect(response.body.results[0].result.hops.at(-1).stats.avg).to.be.above(1);
		expect(response.body.results[0].result.hops.at(-1).stats.avg).to.be.below(1000);
		expect(response).to.matchApiSchema();
	});

	it('should finish successfully in case of IPv6 domain target', async () => {
		const { id } = await got.post('http://localhost:80/v1/measurements', {
			json: {
				target: 'www.jsdelivr.com',
				type: 'mtr',
				measurementOptions: {
					ipVersion: 6,
				},
			},
		}).json<any>();

		const response = await waitMeasurementFinish(id);

		expect(response.body.status).to.equal('finished');
		expect(response.body.results[0].result.status).to.equal('finished');
		expect(response.body.results[0].result.hops.at(-1).stats.avg).to.be.above(1);
		expect(response.body.results[0].result.hops.at(-1).stats.avg).to.be.below(1000);
		expect(response).to.matchApiSchema();
	});

	it('should finish successfully in case of IPv6 address target', async () => {
		const { id } = await got.post('http://localhost:80/v1/measurements', {
			json: {
				target: '2606:4700:3037::ac43:d071',
				type: 'mtr',
			},
		}).json<any>();

		const response = await waitMeasurementFinish(id);

		expect(response.body.status).to.equal('finished');
		expect(response.body.results[0].result.status).to.equal('finished');
		expect(response.body.results[0].result.hops.at(-1).stats.avg).to.be.above(1);
		expect(response.body.results[0].result.hops.at(-1).stats.avg).to.be.below(1000);
		expect(response).to.matchApiSchema();
	});

	it('should return 400 for blacklisted target', async () => {
		const response = await got.post('http://localhost:80/v1/measurements', {
			json: {
				target: 'google-ads.xyz',
				type: 'mtr',
			},
			throwHttpErrors: false,
		});

		expect(response.statusCode).to.equal(400);
	});
});
