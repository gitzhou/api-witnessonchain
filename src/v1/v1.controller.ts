import { Controller, Get, Param, Query } from '@nestjs/common';
import { SigService } from '../rabin/sig.service';
import { getTimestamp, toBufferLE } from '../utils';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { V1Service } from './v1.service';
import { BadParameter } from '../errors';

@Controller('v1')
export class V1Controller {
  constructor(
    private readonly v1Service: V1Service,
    private readonly sigService: SigService,
  ) {}

  private static readonly MARKER = {
    TIMESTAMP: 1,
    PRICE: 2,
    CHAININFO: 3,
  };

  @Get('/timestamp')
  @ApiTags('v1')
  @ApiOperation({ summary: 'get timestamp' })
  @ApiQuery({
    name: 'nonce',
    required: false,
    type: String,
    description: 'user nonce',
  })
  getTimestamp(@Query('nonce') nonce: string) {
    const timestamp = getTimestamp();
    const data = Buffer.concat([
      toBufferLE(V1Controller.MARKER.TIMESTAMP, 1), // api marker, 1 byte
      toBufferLE(timestamp, 4), // timestamp, 4 bytes LE
      Buffer.from(nonce || '', 'hex'), // nonce
    ]);
    const sigResponse = this.sigService.sign(data);
    return {
      timestamp,
      ...sigResponse,
    };
  }

  @Get('price/:base/:query')
  @ApiTags('v1')
  @ApiOperation({ summary: 'get price of trading pair' })
  @ApiParam({
    name: 'base',
    required: true,
    type: String,
    description: 'base coin of the trading pair, case insensitive, e.g. USDT',
  })
  @ApiParam({
    name: 'query',
    required: true,
    type: String,
    description: 'query coin of the trading pair, case insensitive, e.g. BTC',
  })
  @ApiQuery({
    name: 'nonce',
    required: false,
    type: String,
    description: 'user nonce',
  })
  async getPrice(
    @Param('base') base: string,
    @Param('query') query: string,
    @Query('nonce') nonce: string,
  ) {
    query = query.trim().toUpperCase();
    base = base.trim().toUpperCase();
    const tradingPair = `${query}-${base}`;
    const decimal = 4;
    const price = await this.v1Service.getOkxPrice(tradingPair, decimal);

    const timestamp = getTimestamp();
    const data = Buffer.concat([
      toBufferLE(V1Controller.MARKER.PRICE, 1), // api marker, 1 byte
      toBufferLE(timestamp, 4), // timestamp, 4 bytes LE
      toBufferLE(price, 8), // price, 8 bytes LE
      toBufferLE(decimal, 1), // decimal, 1 byte
      Buffer.from(tradingPair), // trading pair
      Buffer.from(nonce || '', 'hex'), // nonce
    ]);
    const sigResponse = this.sigService.sign(data);

    return {
      timestamp,
      tradingPair,
      price,
      decimal,
      ...sigResponse,
    };
  }

  @Get('chaininfo/:chain/:network')
  @ApiTags('v1')
  @ApiOperation({ summary: 'get blockchain info' })
  @ApiParam({
    name: 'chain',
    required: true,
    type: String,
    description: 'chain name, case insensitive',
  })
  @ApiParam({
    name: 'network',
    required: true,
    type: String,
    description: 'chain network, mainnet or testnet, case insensitive',
  })
  @ApiQuery({
    name: 'extra',
    required: false,
    type: String,
    description: 'extra signed fields: bestBlockHash,chainWork,medianTimePast',
  })
  @ApiQuery({
    name: 'nonce',
    required: false,
    type: String,
    description: 'user nonce',
  })
  async getChainInfo(
    @Param('chain') chain: string,
    @Param('network') network: string,
    @Query('extra') extra: string,
    @Query('nonce') nonce: string,
  ) {
    const optionalFields = ['bestblockhash', 'chainwork', 'mediantimepast'];
    const extraFields = extra
      ? extra.split(',').map((e) => e.trim().toLowerCase())
      : [];
    const unknownFields = extraFields.filter(
      (e) => !optionalFields.includes(e),
    );
    if (unknownFields.length > 0) {
      throw new BadParameter(`unsupported extra signed fields`);
    }
    // a marker that represents the extra signed fields
    // e.g. the index of `chainwork` in `optionalFields` is 1
    //   if extraFields includes `chainwork`
    //   then `extraMarker` & 00000010 would be 1
    let extraMarker = 0;
    extraFields.forEach((e) => (extraMarker |= 2 ** optionalFields.indexOf(e)));

    chain = chain.trim().toUpperCase();
    network = network.trim().toLowerCase();
    const { height, bestBlockHash, chainWork, medianTimePast } =
      await this.v1Service.getChainInfo(chain, network);

    // values in the same order as their keys in `optionalFields`
    const optionalSigned = [
      Buffer.from(bestBlockHash, 'hex'), // best block hash, 32 bytes
      Buffer.from(chainWork, 'hex'), // chain work, 32 bytes
      toBufferLE(medianTimePast, 4), // median time past, 4 bytes LE
    ];
    const extraSigned = optionalFields.map((e, i) =>
      extraFields.includes(e) ? optionalSigned[i] : Buffer.alloc(0),
    );

    const timestamp = getTimestamp();
    const data = Buffer.concat([
      toBufferLE(V1Controller.MARKER.CHAININFO, 1), // api marker, 1 byte
      toBufferLE(timestamp, 4), // timestamp, 4 bytes LE
      toBufferLE(height, 4), // block height, 4 bytes LE
      toBufferLE(extraMarker, 1), // extra signed marker, 1 byte
      ...extraSigned,
      Buffer.from(chain), // chain name
      Buffer.from(network), // chain network
      Buffer.from(nonce || '', 'hex'), // nonce
    ]);
    const sigResponse = this.sigService.sign(data);

    return {
      timestamp,
      chain,
      network,
      height,
      bestBlockHash,
      chainWork,
      medianTimePast,
      extraSignedMarker: extraMarker,
      ...sigResponse,
    };
  }
}
