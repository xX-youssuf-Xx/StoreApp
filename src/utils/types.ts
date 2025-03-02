export type User = {
    last_backup: number
}

export type Item = {
    boughtqAt: string, 
    boughtPrice: number, 
    totalWeight: number,
    weight: number,
    order: number,
    importedAt: string
}

export type qrDataType = {
    from: number,
    intLength: number,
    floatLength: number
}

export type Product = {
    name ? : string,
    boxWeight: number, 
    isQrable: Boolean, 
    isStatic: Boolean,
    isKgInTable: Boolean, // Add this new property
    items: Item[],
    qrData?: qrDataType,
    itemCount?:  number
}

export type ProuctsType = {
    [key: string]: Product;
}

export type Client = {
    receipts: {}
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
    Pnumber: number, // Add this line
    items: {
        [itemId: string]: number
    }
}

export type Receipt = {
    totalBoughtPrice: any
    returnedAt: any
    status: string
    Rnumber: number,
    id: string
    client: string,
    initialBalance: number,
    totalPrice: number,
    createdAt: string,
    moneyPaid: number,
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