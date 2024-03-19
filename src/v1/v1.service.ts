import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  BadParameter,
  BaseError,
  InscriptionNotFound,
  ServiceUnavailable,
} from '../errors';

@Injectable()
export class V1Service {
  /**
   * @param tradingPair e.g. `BTC-USDT`, `BTC-USDC`, etc
   * @param decimal decimal of the returned price
   * @returns returns an integer representing the price of the trading pair, e.g. return 1234 with decimal 2 means 12.34
   */
  async getOkxPrice(tradingPair: string, decimal: number) {
    try {
      const r = await axios
        .get(`https://www.okx.com/api/v5/market/ticker?instId=${tradingPair}`)
        .then((r) => r.data);
      if (r.code === '0') {
        return Math.trunc(Number(r.data[0].last) * 10 ** decimal);
      }
      if (r.code === '51001') {
        throw new BadParameter(`unsupported trading pair ${tradingPair}`);
      }
    } catch (e) {
      if (e instanceof BaseError) {
        throw e;
      }
      throw new ServiceUnavailable(`error getting OKX price of ${tradingPair}`);
    }
  }

  /**
   * @see {@link https://docs.taal.com/core-products/whatsonchain/chain-info#get-blockchain-info}
   */
  async getBsvChainInfo(network: string) {
    try {
      const _network = network === 'mainnet' ? 'main' : 'test';
      const chainInfo = await axios
        .get(`https://api.whatsonchain.com/v1/bsv/${_network}/chain/info`)
        .then((r) => r.data);
      const height = chainInfo.blocks;
      const bestBlockHash = chainInfo.bestblockhash;
      const chainWork = chainInfo.chainwork;
      const medianTimePast = chainInfo.mediantime;
      return { height, bestBlockHash, chainWork, medianTimePast };
    } catch {
      throw new ServiceUnavailable(`error getting BSV ${network} chain info`);
    }
  }

  async getMvcChainInfo(network: string) {
    try {
      const chainInfo = await axios
        .get(`https://${network}.mvcapi.com/block/info`)
        .then((r) => r.data);
      const height = chainInfo.blocks;
      const bestBlockHash = chainInfo.bestBlockHash;
      const chainWork = chainInfo.chainwork;
      const medianTimePast = chainInfo.medianTime;
      return { height, bestBlockHash, chainWork, medianTimePast };
    } catch {
      throw new ServiceUnavailable(`error getting MVC ${network} chain info`);
    }
  }

  async getChainInfo(chain: string, network: string) {
    if (!['mainnet', 'testnet'].includes(network)) {
      throw new BadParameter(
        'chain network should be either mainnet or testnet',
      );
    }
    switch (chain.toUpperCase()) {
      case 'BSV':
        return this.getBsvChainInfo(network);
      case 'MVC':
        return this.getMvcChainInfo(network);
      default:
        throw new BadParameter(`unsupported chain ${chain}`);
    }
  }

  async getInscription(network: string, txid: string, vout: number) {
    try {
      if (!['testnet'].includes(network)) {
        throw new BadParameter('only supports testnet');
      }
      const hosts = {
        testnet: process.env.INSCRIPTION_API_HOST_TESTNET,
        mainnet: process.env.INSCRIPTION_API_HOST_MAINNET,
      };
      const response = await axios
        .get(`${hosts[network]}/api/inscriptions/txid/${txid}`)
        .then((r) => r.data)
        .then((r) =>
          r.filter(
            (o) => o.vout === vout && (o.data?.bsv20 || o.origin?.outpoint),
          ),
        );
      if (response.length === 0) {
        throw new InscriptionNotFound(`outpoint ${txid}_${vout}`);
      }
      return response[0];
    } catch (e) {
      if (e instanceof BaseError) {
        throw e;
      }
      throw new ServiceUnavailable(
        `error getting inscription from outpoint ${txid}_${vout}, ${e}`,
      );
    }
  }
}
