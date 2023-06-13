import Request from "../index";
import {RequestParamsType} from "../../types/index";

export function callButton(data: RequestParamsType) {
    data.args.push({'front': true})
    return Request.post({
        url: '/front/dataset/call_button',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                model: data.model,
                method: data.method,
                args: data.args,
            }
        }
    })
}


export function callFields(data: RequestParamsType) {
    return Request.post({
        url: '/front/dataset/fields_get',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                model: data.model,
                method: 'fields_get',
                args: data.args,
                kwargs: data.kwargs || {'context': {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true}}
            }
        }
    })
}

export function callKw(data: RequestParamsType) {
    return Request.post({
        url: '/front/dataset/call_kw/',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                model: data.model,
                method: data.method,
                args: data.args,
                kwargs: data.kwargs || {'context': {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true}}
            }
        }
    })
}


export function callNames(data: RequestParamsType) {
    return callKw({
        model: data.model,
        method: 'name_search',
        args: data.args,
        kwargs: data.kwargs || {'context': {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true}}
    })
}

export function callOnchange(data: RequestParamsType) {
    return callKw({
        model: data.model,
        method: 'onchange',
        args: data.args,
        kwargs: data.kwargs || {}
    })
}


export function callRead(data: RequestParamsType) {
    return callKw({
        model: data.model,
        method: 'read',
        args: data.args,
        kwargs: data.kwargs || {'context': {'lang': 'zh_CN', 'tz': false, 'uid': 2, 'front': true}}
    })
}


export function callSearchRead(data: RequestParamsType) {
    return Request.post({
        url: '/front/dataset/search_read/',
        data: {
            'jsonrpc': "2.0",
            'method': 'call',
            'params': {
                model: data.model,
                fields: data.fields,
                offset: data.offset,
                limit: data.limit,
                domain: data.domain,
                sort: data.sort
            }
        }
    })
}

export function callFile(data: RequestParamsType, loading) {
    const fileType = data.converter.split('-')[1];
    Request.get({
        url: '/front/report/' + data.converter.split('-')[1] + '/' + data.reportname + '/' + data.docids,
        responseType: 'blob'
    }).then(async res => {  // 请求成功后处理流
        console.log(res);
        const blob = new Blob([res])
        const downloadElement = document.createElement('a');
        const href = window.URL.createObjectURL(blob); //创建下载的链接
        downloadElement.href = href;
        downloadElement.download = data.name + '.' + fileType; //下载后文件名
        document.body.appendChild(downloadElement);
        await downloadElement.click(); //点击下载
        document.body.removeChild(downloadElement); //下载完成移除元素
        window.URL.revokeObjectURL(href); //释放掉blob对象
        loading.value = false;
    })
}

export function callWrite(params, data) {
    return callKw({
        model: params.model,
        method: 'write',
        args: [params.id, data]
    })
}

export function callCreate(params, data) {
    return callKw({
        model: params.model,
        method: 'create',
        args: [data]
    })
}