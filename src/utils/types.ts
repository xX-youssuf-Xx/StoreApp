export type User = {
    last_backup: number
}

export type Item = {
    boughtqAt: string, 
    boughtPrice: number, 
    totalWeight: number,
    weight: number,
}

export type qrDataType = {
    from: number,
    intLength: number,
    floatLength: number
}

export type Product = {
    boxWeight: number, 
    isQrable: Boolean, 
    isStatic: Boolean,
    items: Item[],
    qrData?: qrDataType
}

export type ProuctsType = {
    [key: string]: Product;
}

export type Client = {
    name: string, 
    number: string,
    balance: number
}

export type ClientsType = {
    [key: string]: Client;
}

export type ReceiptProduct = {
    sellPrice: number,
    totalWeight?: number,
    items: {
        [itemId: string]: number
    }
}

export type Receipt = {
    client: string,
    initialClientsBalance: number,
    totalPrice: number,
    amountPaid: number,
    products: {
        [product: string]: ReceiptProduct
    }
}

export type ReceiptsType = {
    [key: string]: Receipt;
}

export type productsReceiptQuery = {
    [productName: string]: ReceiptProduct
}