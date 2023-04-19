type v1ClassTest = (value:any) => boolean;

type v1ClassTestObj = {
    test: v1ClassTest;
    class?: string;
    classes?:string[];
}

type TableV1Options = {
    caption?:string|HTMLElement;
    tr?:TableV1CellOptions;
    appendTest: (row:any) => boolean;
};

type TableV1CellOptions = {
    classes?:string[];
    classTests?:v1ClassTestObj[];
    listeners?:TableV1Listener[]|TableV1ListenerGroup;
    attributes?:TableV1Attribute[]|TableV1AttributeGroup;
}

type TableV1Header = {
    title:string;
    th?:TableV1CellOptions;
    td?:TableV1CellOptions;
    getData:(row:any) => string|HTMLElement|number;
    sortable:boolean;
};


type TableV1Listener = {
    event:string;
    callback:EventListener;
    action:EventListener;
}

type TableV1ListenerGroup = {
    [event:string]:TableV1Listener[];
}

type TableV1AttributeTest = (value:any) => string;

type TableV1Attribute = {
    name?:string;
    attribute?:string;
    value?:string;
    test:TableV1AttributeTest;
};

type TableV1AttributeGroup = {
    [name:string]:string|TableV1AttributeTest;
};


type TableV1ClassTest = (value:any) => boolean;

type TableV1ClassTestObj = {
    test: TableV1ClassTest;
    class?: string;
    classes?:string[];
}