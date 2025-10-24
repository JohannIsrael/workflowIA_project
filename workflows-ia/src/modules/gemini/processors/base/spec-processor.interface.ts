export interface ISpecProcessor<TIn = any, TOut = any> {
  setNext(processor: ISpecProcessor): ISpecProcessor;
  process(input: TIn): Promise<TOut> | TOut;
}

export abstract class BaseSpecProcessor<TIn = any, TOut = any> implements ISpecProcessor<TIn, TOut> {
  private nextProcessor: ISpecProcessor | null = null;

  public setNext(processor: ISpecProcessor): ISpecProcessor {
    this.nextProcessor = processor;
    return processor;
  }

  public async process(input: TIn): Promise<TOut> {
    const result = await this.handle(input);
    if (this.nextProcessor) {
      return this.nextProcessor.process(result);
    }
    return result as TOut;
  }

  protected abstract handle(input: TIn): Promise<any> | any;
}