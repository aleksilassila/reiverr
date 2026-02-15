import {
  All,
  Controller,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@ApiTags('proxy')
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Catch-all route that proxies all HTTP methods to the specified destination
   * Usage: /proxy/https://example.com/api/endpoint?param=value
   */
  @All('*')
  @ApiOperation({
    summary: 'Proxy all requests to a destination URL',
    description:
      'Forwards all HTTP requests (GET, POST, PUT, DELETE, etc.) to the specified destination URL. ' +
      'The URL should be provided in the path after /proxy/',
  })
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    // Extract the path after /proxy/
    const pathAfterProxy = req.path.replace(/^.*\/proxy\/?/, '');

    if (!pathAfterProxy) {
      throw new HttpException(
        'Destination URL is required. Use /proxy/https://example.com',
        HttpStatus.BAD_REQUEST,
      );
    }

    let destinationUrl = pathAfterProxy;

    // Validate URL format
    try {
      new URL(destinationUrl);
    } catch (error) {
      console.error('Invalid URL format:', destinationUrl, error);

      throw new HttpException(
        'Invalid destination URL format',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Append query parameters to the destination URL
    const queryParams = { ...req.query };

    // If there are query parameters, append them to the destination URL
    if (Object.keys(queryParams).length > 0) {
      const url = new URL(destinationUrl);
      Object.entries(queryParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      });
      destinationUrl = url.toString();
    }

    try {
      const response = await this.proxyService.proxyRequest(
        destinationUrl,
        req.method,
        '', // Path is already included in destinationUrl
        req.headers,
        req.body,
        {}, // Query params already appended to destinationUrl
      );

      // Forward response headers (excluding some that shouldn't be forwarded)
      const headersToSkip = [
        'transfer-encoding',
        'connection',
        'keep-alive',
        'upgrade',
      ];
      Object.keys(response.headers).forEach((key) => {
        if (!headersToSkip.includes(key.toLowerCase())) {
          res.setHeader(key, response.headers[key]);
        }
      });

      // Set status and send response
      res.status(response.status).send(response.data);
    } catch (error) {
      throw error;
    }
  }
}
