import {defineStore} from "pinia";
import {loadMenus} from "../service/module/call";

export const useTypeStore = defineStore("type", {
    state: () => ({
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

export const useMenusStore = defineStore('menus', {
    state: () => {
        return {menus: {}}
    },
    actions: {
        async getMenus(parent_id = 'root') {//修改当前登录的状态
            if (!Object.keys(this.menus[parent_id] || {}).length) {
                this.menus[parent_id] = await loadMenus(parseInt(parent_id));
            }
            return this.menus[parent_id];
        }
    }
})
