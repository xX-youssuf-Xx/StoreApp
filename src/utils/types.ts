export type User = {
    last_backup: number
}

export type Item = {
    boughtqAt: string, 
    boughtPrice: number, 
    totalWeight: number,
    weight: number,
}

export type Product = {
    boxWeight: number, 
    isQrable: Boolean, 
    isStatic: Boolean,
    items: Item[]
}

export type ProuctsType = {
    [key: string]: Product;
}