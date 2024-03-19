export interface IErrorResponse {
  readonly statusCode: number;
  readonly message: string;
}

export class BaseError extends Error implements IErrorResponse {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
  ) {
    super(message);
  }
}

export class BadParameter extends BaseError {
  constructor(message: string | undefined = undefined) {
    const defaultMessage = 'bad parameter';
    const errorMessage =
      message === undefined ? defaultMessage : `${defaultMessage}, ${message}`;
    super(400, errorMessage);
  }
}

export class ServiceUnavailable extends BaseError {
  constructor(message: string) {
    const defaultMessage = 'service unavailable';
    const errorMessage =
      message === undefined ? defaultMessage : `${defaultMessage}, ${message}`;
    super(503, errorMessage);
  }
}

export class InscriptionNotFound extends BaseError {
  constructor(message: string) {
    const defaultMessage = 'inscription not found';
    const errorMessage =
      message === undefined ? defaultMessage : `${defaultMessage}, ${message}`;
    super(503, errorMessage);
  }
}
