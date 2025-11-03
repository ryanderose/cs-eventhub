import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export type ApiRequest = ExpressRequest | VercelRequest;
export type ApiResponse = ExpressResponse | VercelResponse;

export type AsyncRouteHandler = (req: ApiRequest, res: ApiResponse) => void | Promise<unknown>;
