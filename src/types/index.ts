type Domain = [string, string, Multiple]
type Id = number[] | number | false;
type Params = { id?: Id, action: Id, model: string, view_type: 'tree' | 'form', menu_id?: Id }
export type Multiple = string | number | number[] | string[] | boolean

export interface RequestParamsType {
    model: string,
    method?: string,
    args?: [
        Id,
            string[] | { [prop: string]: number | string | number[] },
        string?,
        { [prop: string]: string }?,
        {
            lang?: string,
            tz?: boolean | string,
            uid?: Id,
            params?: Params
        }?
    ],
    kwargs?: {
        domain?: Domain,
        fields?: string[],
        lang?: string,
        tz?: boolean | string,
        uid?: Id,
        params?: Params,
        bin_size?: boolean
        name?: string,
        args?: [string | Domain],
        operator?: string,
        limit?: number,
        context?: {}
    },
    domain?: Domain,
    sort?: string,
    limit?: number,
    offset?: number,
    fields?: string[],
    name?: string,
    converter?: string,
    docids?: string
}

export interface FieldOption {
    type: string,
    change_default?: boolean,
    company_dependent?: boolean,
    context?: { [prop: string]: Multiple },
    depends?: string[],
    domain?: Domain,
    manual?: boolean,
    readonly: boolean,
    relation?: string,
    relation_field?: string,
    required: boolean,
    selection?: [number, string],
    searchable?: boolean,
    sortable?: boolean,
    store?: boolean,
    string: string,
    onchange: boolean,
    invisible?: boolean
    curSelect?: string
}

export interface ModuleDataType {
    type?: string,
    buttons?: [{
        type: string,
        text: string,
        method: string
    }],
    id: number | number[],
    name?: string,
    title?: string,
    sort?: string,
    limit: number,
    offset: number,
    domain?: Domain,
    model: string,
    fields: string[],
    count: number,
    attributes?: {
        [prop: string]: {
            readonly?: string,
            invisible?: string
        }
    },
    tables?: {
        [prop: string]: ModuleDataType
    }
}

export interface DataType {
    formData: { [prop: string]: Multiple },
    treeData: { [prop: string]: [{ [prop: string]: Multiple }] },
    listData?: []
}

export interface FieldOptionType {
    formFieldsOption: { [prop: string]: FieldOption },
    treeFieldsOption: { [prop: string]: { [prop: string]: FieldOption } }
}

export interface OnchangeParamsType {
    options: FieldOption,
    datas: { [prop: string]: Multiple },
    field: string,
    treeDatas: { [prop: string]: [{ [prop: string]: Multiple }] },
    model: string,
    params: ModuleDataType,
    form?: {
        field: string,
        datas: { [prop: string]: Multiple },
        model: string,
        options: FieldOptionType
    }
}
