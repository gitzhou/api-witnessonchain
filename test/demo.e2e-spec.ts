import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { V2Module } from '../src/v2/v2.module';
import { Demo } from '../src/contracts/demo';
import { AppModule } from '../src/app.module';
import { getDefaultSigner } from './utils/helper';

jest.setTimeout(60000); // https://stackoverflow.com/a/72031538

describe('Verify oracle signature in contract Demo (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [V2Module, AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // load contract
    Demo.loadArtifact();
  });

  async function get(path: string) {
    return request(app.getHttpServer())
      .get(path)
      .then((r) => r.body);
  }

  it('should pass', async () => {
    // get oracle public key
    const pubKeyResponse = await get('/info');
    const oraclePubKey = Demo.parsePubKey(pubKeyResponse);
    // create contract instance
    const instance = new Demo(oraclePubKey);
    // connect contract instance to the default signer
    await instance.connect(getDefaultSigner());
    // contract deploy
    await instance.deploy();
    // get oracle timestamp response
    const timestampResponse = await get('/v2/timestamp');
    const data = timestampResponse.data;
    const sig = Demo.parseSig(timestampResponse);
    // contract call
    const call = async () => await instance.methods.unlock(data, sig);
    await expect(call()).resolves.not.toThrow(); // https://stackoverflow.com/a/54548606
  });
});
