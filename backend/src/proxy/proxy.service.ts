import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class ProxyService {
  /**
   * Proxies an HTTP request to the specified destination URL
   * @param destinationUrl The target URL to proxy the request to
   * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param path Additional path to append to the destination URL
   * @param headers Request headers to forward
   * @param body Request body for POST/PUT/PATCH requests
   * @param queryParams Query parameters to forward
   * @returns The proxied response
   */
  async proxyRequest(
    destinationUrl: string,
    method: string,
    path: string = '',
    headers: Record<string, any> = {},
    body?: any,
    queryParams?: Record<string, any>,
  ): Promise<AxiosResponse> {
    try {
      // Remove host and other headers that shouldn't be forwarded
      const forwardHeaders = { ...headers };
      delete forwardHeaders['host'];
      delete forwardHeaders['content-length'];
      delete forwardHeaders['connection'];

      const url = path ? `${destinationUrl}${path}` : destinationUrl;

      const config: AxiosRequestConfig = {
        method: method.toLowerCase(),
        url,
        headers: forwardHeaders,
        params: queryParams,
        data: body,
        validateStatus: () => true, // Don't throw on any status code
        maxRedirects: 5,
        timeout: 30000, // 30 second timeout
      };

      const response = await axios(config);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          error.response?.data || error.message,
          error.response?.status || HttpStatus.BAD_GATEWAY,
        );
      }
      throw new HttpException(
        'Proxy request failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
