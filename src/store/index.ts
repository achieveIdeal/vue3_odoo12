import {defineStore} from "pinia";

export const useTypeStore = defineStore("type", {
    state: () => ({
        types: {
            char: 'text',
            many2one: 'text',
            many2many: 'text',
            one2many: 'text',
            boolean: 'checkbox',
            float: 'number',
            integer: 'number',
            selection: 'text',
            text: 'textarea',
            binary: 'file',
            datetime: 'date',
            date: 'date',
        },
        many2oneTypes: ['many2one'],
        fileType: ['binary'],
        selectionTypes: ['selection'],
        toManyTypes: ['many2many', 'one2many'],
        numberTypes: ['float', 'integer'],
        BooleanType: ['boolean'],
    }),
    getters: {
        is2One: (state) => (type: string) => {
            return state.many2oneTypes.indexOf(type) !== -1
        },
        is2Many: (state) => (type: string) => {
            return state.toManyTypes.indexOf(type) !== -1
        },
        isSelection: (state) => (type: string) => {
            return state.selectionTypes.indexOf(type) !== -1
        },
        isFile: (state) => (type: string) => {
            return state.fileType.indexOf(type) !== -1
        },
        isDigit: (state) => (type) => {
            return state.numberTypes.indexOf(type) !== -1
        },
        isBool: (state) => (type) => {
            return state.BooleanType.indexOf(type) !== -1
        },
    },
})

