import axios from "axios";
import type {AxiosInstance} from "axios";
import {RequestConfig} from "./type";
import {BASEURL, TIMEOUT} from "./config";
import {ElMessage} from "element-plus";
import {eventBus} from "../tools";
// 用类封装的好处,可以创建多个axios实例
class Request {
    instance: AxiosInstance;

    constructor(config: RequestConfig) {
        this.instance = axios.create(config);
        // 每个instance都添加拦截器
        this.instance.interceptors.request.use(
            (config) => {
                if (config.data.params.method !== 'name_search') {
                    eventBus.emit('requestCallback', config)
                }
                return config;
            },
            (err) => {
                eventBus.emit('requestCallback', err)
                return err;
            }
        );
        this.instance.interceptors.response.use(
            (res) => {
                eventBus.emit('responseCallback', res)
                if (res.data.error) {
                    ElMessage({
                        message: res.data.error.data.message,
                        type: 'error'
                    });
                    return false
                }
                return res.data.result || {};
            },
            (err) => {
                eventBus.emit('responseCallback', err)
                if (res.data.error) {
                    ElMessage({
                        message: err,
                        type: 'error'
                    });
                    return false
                }
                return err;
            }
        );
        // 对单个instance添加拦截器
        this.instance.interceptors.request.use(
            config.interceptors?.requestSuccessFn,
            config.interceptors?.requestFailureFn
        );
        this.instance.interceptors.response.use(
            config.interceptors?.responseSuccessFn,
            config.interceptors?.responseFailureFn
        );
    }

    // 封装网络请求方法
    // 使用泛型确定返回data的具体类型
    request<T = any>(config: RequestConfig<T>) {
        // 单个instance中某个请求也可能会有单独拦截器,对config进行处理后重新赋值给config
        if (config.interceptors?.requestSuccessFn) {
            config = config.interceptors.requestSuccessFn(config);
        }
        return new Promise<T>((resolve, reject) => {
            this.instance
                .request<any, T>(config)
                .then((res) => {
                    // 单个instance中某个请求也可能会有单独拦截器,对res进行处理后重新赋值给res
                    if (config.interceptors?.responseSuccessFn) {
                        res = config.interceptors.responseSuccessFn(res);
                    }
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    get<T = any>(config: RequestConfig<T>) {
        return this.request({...config, method: "GET"});
    }

    post<T = any>(config: RequestConfig<T>) {
        return this.request({...config, method: "POST"});
    }

    delete<T = any>(config: RequestConfig<T>) {
        return this.request({...config, method: "DELETE"});
    }

    patch<T = any>(config: RequestConfig<T>) {
        return this.request({...config, method: "PATCH"});
    }
}

export default new Request({baseURL: BASEURL, timeout: TIMEOUT});
