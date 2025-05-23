import got from 'got';
import config from 'config';
import {
	getContinentByCountry,
	getRegionByCountry,
	getStateIsoByName,
} from '../../location/location.js';
import type { ProviderLocationInfo } from '../client.js';
import {
	normalizeCityName,
	normalizeCityNamePublic,
	normalizeNetworkName,
} from '../utils.js';
import { getCity } from '../city-approximation.js';

type Ip2LocationResponse = {
	ip?: string;
	country_code?: string;
	country_name?: string;
	region_name?: string;
	city_name?: string;
	zip_code?: string;
	time_zone?: string;
	asn?: string;
	latitude?: number;
	longitude?: number;
	as?: string;
	is_proxy?: boolean;
	usage_type?: string;
};

// https://blog.ip2location.com/knowledge-base/what-is-usage-type/
const HOSTING_USAGE_TYPES = [ 'CDN', 'DCH' ];

export const ip2LocationLookup = async (addr: string): Promise<ProviderLocationInfo> => {
	const result = await got(`https://api.ip2location.io`, {
		searchParams: {
			key: config.get<string>('ip2location.apiKey'),
			ip: addr,
		},
		timeout: { request: 5000 },
	}).json<Ip2LocationResponse>();

	const originalCity = result.city_name || '';
	const originalState = result.country_code === 'US' && result.region_name ? getStateIsoByName(result.region_name) : null;
	const { city, state } = await getCity({ city: originalCity, state: originalState }, result.country_code, result.latitude, result.longitude);

	return {
		provider: 'ip2location',
		continent: result.country_code ? getContinentByCountry(result.country_code) : '',
		region: result.country_code ? getRegionByCountry(result.country_code) : '',
		state,
		country: result.country_code ?? '',
		city: normalizeCityNamePublic(city),
		normalizedCity: normalizeCityName(city),
		asn: Number(result.asn ?? 0),
		latitude: result.latitude ?? 0,
		longitude: result.longitude ?? 0,
		network: result.as ?? '',
		normalizedNetwork: normalizeNetworkName(result.as ?? ''),
		isProxy: result.is_proxy ?? false,
		isHosting: result.usage_type ? HOSTING_USAGE_TYPES.includes(result.usage_type) : null,
		isAnycast: null,
	};
};
