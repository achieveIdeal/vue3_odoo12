import Attachment from "../components/base/fields/Attachment.vue";
import Boolean from "../components/base/fields/Boolean.vue";
import Character from "../components/base/fields/Character.vue";
import Image from "../components/base/fields/Image.vue";
import Many2one from "../components/base/fields/Many2one.vue";
import Number from "../components/base/fields/Number.vue";
import Selection from "../components/base/fields/Selection.vue";
import ToMany from "../components/base/fields/ToMany.vue";


import GroupWidget from '../components/base/widgets/GroupWidget.vue'
import SheetWidget from '../components/base/widgets/SheetWidget.vue'
import NotebookWidget from '../components/base/widgets/NotebookWidget.vue'
import PageWidget from '../components/base/widgets/PageWidget.vue'
import HeaderWidget from '../components/base/widgets/HeaderWidget.vue'

export const FIELD_VIEW_MAP = {
    binary: Attachment,
    boolean: Boolean,
    char: Character,
    date: Character,
    text: Character,
    image: Image,
    many2one: Many2one,
    float: Number,
    integer: Number,
    selection: Selection,
    one2many: ToMany,
    many2many: ToMany,
}

export const WIDGETS = {
    group: GroupWidget,
    sheet: SheetWidget,
    notebook: NotebookWidget,
    page: PageWidget,
    header: HeaderWidget,
}