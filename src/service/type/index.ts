import {AxiosRequestConfig, AxiosResponse} from "axios";

// 因为我们对返回类型做了泛型处理,所以res不能写死
interface Interceptors<T = AxiosResponse> {
    requestSuccessFn?: (config: AxiosRequestConfig) => AxiosRequestConfig;
    requestFailureFn?: (err: any) => any;
    responseSuccessFn?: (res: T) => T;
    responseFailureFn?: (err: any) => any;
}


interface RequestConfig<T = AxiosResponse> extends AxiosRequestConfig {
    interceptors?: Interceptors<T>;
}


export type {RequestConfig}