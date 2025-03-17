import React, {useState,useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import {Item, Receipt, ReceiptProduct} from '../utils/types';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';
import {getProduct} from '../utils/inventory';
import {useFirebase} from '../context/FirebaseContext'; 
import { cowLogoBase64 } from '../utils/imageAssets';
import {returnReceiptHelper} from '../utils/receipts';
import { useLoading } from '../context/LoadingContext';
import { showMessage } from "react-native-flash-message";
import { captureRef } from 'react-native-view-shot';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

interface ReceiptDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  receipt: Receipt | undefined;
  receiptUuid: String | null;
  clientName: String | null;
}

interface ProductDetail {
  items: Record<string, Item>;
  isStatic: boolean;
  isQrable: boolean;
  boxWeight: number;
  isKgInTable: boolean; // Add this line
}

interface SortedProduct extends ReceiptProduct {
  name: string;
}

const ReceiptDetails: React.FC<ReceiptDetailsProps> = ({
  isVisible,
  onClose,
  receipt,
  receiptUuid,
  clientName,
}) => {
  const {db} = useFirebase();
  const { setIsLoadin } = useLoading();
  const [expandedProducts, setExpandedProducts] = useState<{
    [key: string]: boolean;
  }>({});
  const [productDetails, setProductDetails] = useState<
    Record<string, ProductDetail>
  >({});
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const viewRef = useRef(null);  // Add this new ref
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const contentRef = useRef<View>(null);

// Add this new function to handle WebView load completion
const handleWebViewLoad = () => {
  setIsWebViewReady(true);
};

// Update the handleGenerateImage function
const handleGenerateImage = async () => {
  try {
    setIsLoadin(true);
    const details = await fetchAllProductDetails();
    if (!details) {
      throw new Error('Failed to fetch product details');
    }

    // Add image-specific styles to the HTML content
    const imageSpecificStyles = `
      <style class="image-only-styles">
        body {
          transform: scale(0.7);
          transform-origin: top left;
        }
        .container {
          width: 550px !important;
          margin: 0 !important;
          padding: 10px !important;
          display: flex !important;
          flex-direction: column !important;
          min-height: 600px !important; /* Set minimum height */
        }
        .products-table {
          width: 100% !important;
          font-size: 10px !important;
          margin: 10px 0 !important;
        }
        .products-table th,
        .products-table td {
          padding: 4px !important;
          font-size: 10px !important;
        }
        .weights-section {
          width: 100% !important;
          margin-top: auto !important; /* Push to bottom */
          margin-bottom: 20px !important;
          position: relative !important;
          bottom: 0 !important;
        }
        .weights-table {
          width: 95% !important;
          margin: 10px auto !important;
          font-size: 10px !important;
          page-break-inside: avoid !important;
        }
        .weight-cell {
          font-size: 10px !important;
          padding: 2px !important;
        }
        .product-header {
          font-size: 10px !important;
          padding: 2px !important;
        }
        .total-weight {
          font-size: 10px !important;
          padding: 2px !important;
        }
        .summary-container {
          margin: 10px auto !important;
        }
      </style>
    `;

    // Generate HTML content with additional styles
    const html = generateDetailedReceiptHTML(details);
    const htmlWithImageStyles = html.replace('</head>', `${imageSpecificStyles}</head>`);
    setHtmlContent(htmlWithImageStyles);

    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!contentRef.current) {
      throw new Error('Content reference not found');
    }

    // Rest of your existing code...
    const uri = await captureRef(contentRef, {
      format: 'jpg',
      quality: 0.9,
      result: 'base64'
    }); 

    const fileName = `Receipt_${receipt?.Rnumber || 'unknown'}_${Date.now()}.jpg`;
    const filePath = `${Platform.OS === 'android' ? 'file://' : ''}${RNFS.DocumentDirectoryPath}/${fileName}`;

    await RNFS.writeFile(filePath, uri, 'base64');
    await FileViewer.open(filePath, {
      showOpenWithDialog: true,
    });

  } catch (error) {
    console.error('Error generating image:', error);
    Alert.alert('Error', 'Failed to generate receipt image');
  } finally {
    setIsLoadin(false);
  }
};
  
  // Add this function near the top of your component
  const logReceiptDetails = (receipt: Receipt) => {
    const details = {
      receiptId: receiptUuid,
      Rnumber: receipt.Rnumber,
      client: receipt.client,
      createdAt: receipt.createdAt,
      initialBalance: receipt.initialBalance,
      moneyPaid: receipt.moneyPaid,
      products: receipt.products,
      returnedAt: receipt.returnedAt,
      status: receipt.status,
      totalBoughtPrice: receipt.totalBoughtPrice,
      totalPrice: receipt.totalPrice,
    };
  
    console.log('\nReceipt Details:');
    console.log('----------------------------------------');
    Object.entries(details).forEach(([key, value]) => {
      console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
    });
    console.log('----------------------------------------\n');
  };

  // Fetch product details when receipt changes
  useEffect(() => {
    if (isVisible && receipt) {
      fetchAllProductDetails();
    }
  }, [isVisible, receipt]);

  const convertToLbs = (kg: number) => (kg / 0.455).toFixed(2);

  const calculateTotal = (product: ReceiptProduct) => {
    if (!product) return 0;
    return ((product.totalWeight || 0) * (product.sellPrice || 0)).toFixed(2);
  };

  const calculateNetBalance = () => {
    if (!receipt) return 0;
    return (
      (receipt.initialBalance || 0) +
      (receipt.totalPrice || 0) -
      (receipt.moneyPaid || 0)
    ).toFixed(2);
  };

  const toggleProductExpansion = (productName: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productName]: !prev[productName],
    }));
  };

  const getArabicOrdinal = (number: number) => {
    const ordinals = [
      'الأولى',
      'الثانية',
      'الثالثة',
      'الرابعة',
      'الخامسة',
      'السادسة',
      'السابعة',
      'الثامنة',
      'التاسعة',
      'العاشرة',
    ];
    return ordinals[number - 1] || number.toString();
  };

  const allItemsHaveSameWeight = (items: Record<string, number>): boolean => {
    const weights = Object.values(items);
    return weights.every(weight => weight === weights[0]);
  };

  // Generate the weights table HTML
  const generateWeightTables = () => {
    if (!receipt?.products || !productDetails) return '';

    const MAX_ITEMS_PER_COLUMN = 5;
    const MAX_COLUMNS = 5;

    const generateProductColumns = (
      productName: string,
      items: Record<string, number>,
    ) => {
      // Skip static products
      if (productDetails[productName]?.isStatic) {
        return [];
      }

      if (allItemsHaveSameWeight(items)) {
        return [];
      }

      // Get product details and sort items by order
      const productDetail = productDetails[productName];
      const sortedItems = Object.entries(items)
        .sort(([idA], [idB]) => {
          const orderA = productDetail?.items[idA]?.order || 0;
          const orderB = productDetail?.items[idB]?.order || 0;
          return orderA - orderB;
        })
        .map(([_, weight]) => weight);

      const columns = [];
      for (let i = 0; i < sortedItems.length; i += MAX_ITEMS_PER_COLUMN) {
        const columnWeights = sortedItems.slice(i, i + MAX_ITEMS_PER_COLUMN);
        while (columnWeights.length < MAX_ITEMS_PER_COLUMN) {
          columnWeights.push(0);
        }
        columns.push(columnWeights);
      }

      return columns;
    };

    const allColumns = [];
    let remainingColumns = MAX_COLUMNS;

    Object.entries(receipt.products).forEach(([productName, product]) => {
      const productColumns = generateProductColumns(productName, product.items);

      productColumns.forEach((column, index) => {
        if (remainingColumns > 0) {
          allColumns.push({
            name: index === 0 ? productName : `${productName} (تابع)`,
            weights: column,
            total:
              index === productColumns.length - 1 ? product.totalWeight : null,
          });
          remainingColumns--;
        }
      });
    });

    while (remainingColumns > 0) {
      allColumns.push({
        name: '-',
        weights: Array(MAX_ITEMS_PER_COLUMN).fill(0),
        total: null,
      });
      remainingColumns--;
    }

    const rows = [];
    rows.push(
      `<tr>${allColumns
        .map(col => `<th class="product-header">${col.name}</th>`)
        .join('')}</tr>`,
    );

    for (let i = 0; i < MAX_ITEMS_PER_COLUMN; i++) {
      rows.push(
        `<tr>${allColumns
          .map(
            col =>
              `<td class="weight-cell">${
                col.weights[i]
                  ? (productDetails[col.name]?.isKgInTable && !productDetails[col.name]?.isStatic)
                    ? col.weights[i].toFixed(2)  // Display in kg
                    : convertToLbs(col.weights[i])  // Convert to lbs
                  : '-'
              }</td>`,
          )
          .join('')}</tr>`,
      );
    }

    rows.push(
      `<tr>${allColumns
        .map(
          col =>
            `<td class="total-weight">${
              col.total !== null
                ? (productDetails[col.name]?.isKgInTable && !productDetails[col.name]?.isStatic)
                  ? Number(col.total).toFixed(2)  // Display in kg
                  : convertToLbs(Number(col.total))  // Convert to lbs
                : '-'
            }</td>`,
        )
        .join('')}</tr>`,
    );

    return rows.join('');
  };

  const fetchAllProductDetails = async () => {
    if (!receipt?.products || !db) return;

    const details: Record<string, ProductDetail> = {};

    for (const productName of Object.keys(receipt.products)) {
      try {
        const productDetail = await getProduct(db, productName);
        if (productDetail) {
          // Convert Product to ProductDetail format
          details[productName] = {
            items: Object.fromEntries(
              Object.entries(productDetail.items || {}).map(([id, item]) : [string, Item] => [
                id,
                {
                  order: item.order,
                  weight: item.weight,
                  status: item.status,
                  totalWeight: item.totalWeight,
                  importedAt: item.importedAt,
                  qrString: '',
                  boughtPrice: item.boughtPrice,
                  boughtAt: item.boughtAt
                },
              ]).filter(item => !item[1].status || item[1].status == 'deleted'),
            ),
            isStatic: !!productDetail.isStatic,
            isQrable: !!productDetail.isQrable,
            boxWeight: productDetail.boxWeight || 1,
            isKgInTable: !!productDetail.isKgInTable, // Add this line
          };
        }
      } catch (error) {
        console.error(`Error fetching details for ${productName}:`, error);
      }
    }

    setProductDetails(details);
    console.log('Fetched product details:', details);
    return details;
  };

  const calculateNumberOfItems = (
    productName: string,
    product: ReceiptProduct,
  ) => {
    const productDetail = productDetails[productName];

    if (productDetail?.isStatic && productDetail.boxWeight > 0) {
      // For static products, divide total weight by box weight to get number of items
      return Math.floor((product.totalWeight || 0) / productDetail.boxWeight);
    }

    // For non-static products, count the number of items
    return Object.keys(product.items || {}).length;
  };

  const sortProducts = (
    products: Record<string, ReceiptProduct>,
    details: Record<string, ProductDetail>,
  ): SortedProduct[] => {
    return Object.entries(products || {})
      .sort(([_, a], [__, b]) => (a.Pnumber || 0) - (b.Pnumber || 0))
      .map(([name, product]) => ({
        ...product,
        name,
        items: Object.entries(product.items || {})
          .sort(([idA], [idB]) => {
            const orderA = details[name]?.items[idA]?.order || 0;
            const orderB = details[name]?.items[idB]?.order || 0;
            return orderA - orderB;
          })
          .reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: value,
            }),
            {} as Record<string, number>,
          ),
      }));
  };

  // Generate detailed receipt HTML with weights table only on the last page
  const generateDetailedReceiptHTML = (
    details: Record<string, ProductDetail>,
  ) => {
    const products = sortProducts(receipt?.products || {}, details);
    const PRODUCTS_PER_PAGE = 8;
    const needsSecondPage = products.length > PRODUCTS_PER_PAGE;

    const extractionDate = new Date().toLocaleDateString('ar-EG');
    const receiptDate = receipt?.createdAt
      ? new Date(receipt.createdAt).toLocaleDateString('ar-EG')
      : 'غير محدد';

    // Generate common style block
    const styleBlock = `
      <style>
        @page {
          size: A5 portrait;
          margin: 5mm;
        }
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Cairo', Arial, sans-serif;
          font-size: 12px;
          background-color: white;
        }
        .container {
          width: 138mm;
          box-sizing: border-box;
        }
        .page {
          box-sizing: border-box;
          padding: 5mm;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 0 5px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header-left {
          font-size: 14px;
          color: #333;
          margin-left: 15px;
        }
        .logo {
          width: 60px;
          height: 60px;
        }
        .company-name {
          font-size: 14px;
          color: #333;
        }
        .divider {
          border-bottom: 1px solid #2c3e50;
          margin: 8px 0;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 0 5px;
        }
        .info-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 48%;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 3px 6px;
          background-color: #f8f9fa;
          border-radius: 2px;
          font-size: 12px;
        }
        .info-label {
          color: #2c3e50;
          font-weight: bold;
        }
        .products-table {
          width: 100%;
          margin: 10px 0;
          border-collapse: collapse;
          font-size: 11px;
        }
        .products-table th,
        .products-table td {
          padding: 8px 6px;
          text-align: center;
          border: 1px solid #dee2e6;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          height: 24px;
          line-height: 1.2;
        }
        .product-name-header,
        .product-name-cell {
          max-width: 120px;
          width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .products-table th {
          background-color: #e9ecef;
          color: black;
          font-weight: normal;
          height: 20px;
        }
        .products-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .summary-container {
          display: flex;
          justify-content: space-between;
          margin: 10px 5px;
        }
        .summary-group {
          width: 48%;
          background-color: #f8f9fa;
          padding: 8px;
          border-radius: 4px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .summary-row:last-child {
          border-bottom: none;
        }
        .net-total {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin: 10px auto;
          padding: 8px;
          background-color: rgb(144, 166, 188);
          color: white;
          border-radius: 4px;
          width: fit-content;
        }
        .weights-table {
          width: 70%;
          border-collapse: collapse;
          border: 1px solid #dee2e6;
          font-size: 10px;
          table-layout: fixed;
          margin-top: 15px;
          background-color: white;
        }
        .weights-table th,
        .weights-table td {
          border: 1px solid #dee2e6;
          text-align: center;
          padding: 1px;
          width: 10%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-header {
          background-color: #e9ecef;
          color: black;
          text-align: center;
          font-weight: bold;
          font-size: 10px;
          height: 20px;
        }
        .weight-cell {
          text-align: center;
          height: 12px;
          font-size: 10px;
        }
        .total-weight {
          text-align: center;
          font-weight: bold;
          background-color: #e9ecef;
          font-size: 8px;
        }
        .weights-section {
          margin: 0 20mm;
          margin-top: auto; 
          margin-bottom: 5mm;
          width: 100%;
        }
        .weights-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
          text-align: center;
        }
        .single-weight-note {
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          margin-top: 8px;
          color: #333;
        }
        @media print {
          .page-break {
            clear: both;
            page-break-after: always;
            break-after: page;
            height: 0;
            margin: 0;
            padding: 0;
          }
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 160px;
          color: rgba(220, 53, 69, 0.15);  // Red with low opacity
          z-index: 1000;
          pointer-events: none;
          font-weight: bold;
          white-space: nowrap;
        }
      
        .returned-status {
          color: #dc3545;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          font-size: 16px;
          padding: 5px;
          border: 2px solid #dc3545;
          border-radius: 4px;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }
      </style>
    `;

    // Generate common header block
    const headerBlock = `
      <div class="header">
        <div class="header-right">
          <img src="${cowLogoBase64}" class="logo" />
          <div class="company-name">البركة للحوم المجمدة</div>
        </div>
        <div class="header-left">
          ت/01024963110
        </div>
      </div>
      <div class="divider"></div>
      <div class="info-section">
        <div class="info-group">
          <div class="info-item">
            <span class="info-label">رقم الفاتورة:</span>
            <span class="info-value">${receipt?.Rnumber || 'غير محدد'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">تاريخ الفاتورة:</span>
            <span class="info-value">${receiptDate}</span>
          </div>
        </div>
        <div class="info-group">
          <div class="info-item">
            <span class="info-label">تاريخ الطباعة:</span>
            <span class="info-value">${extractionDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">اسم العميل:</span>
            <span class="info-value">${clientName || 'غير محدد'}</span>
          </div>
        </div>
      </div>
    `;

    const returnedStatusBlock = receipt?.status === 'returned' ? `
    <div class="watermark">مرتجع</div>
    <div class="returned-status">
      تم ارجاع هذا الإيصال بتاريخ ${new Date(receipt.returnedAt || '').toLocaleDateString('ar-EG')}
    </div>
  ` : '';

    // Generate common table headers
    const tableHeaders = `
      <thead>
        <tr>
          <th class="product-name-header">المنتج</th>
          <th>الوزن الكلي</th>
          <th>السعر/كجم</th>
          <th>العدد</th>
          <th>السعر الإجمالي</th>
        </tr>
      </thead>
    `;

    // Generate summary section
    const summarySection = `
      <div class="summary-container">
        <div class="summary-group">
          <div class="summary-row">
            <div>الرصيد السابق:</div>
            <div>${(receipt?.initialBalance || 0).toFixed(2)} ج.م</div>
          </div>
          <div class="summary-row">
            <div>تكلفة المنتجات:</div>
            <div>${(receipt?.totalPrice || 0).toFixed(2)} ج.م</div>
          </div>
        </div>
        <div class="summary-group">
          <div class="summary-row">
            <div>الإجمالي:</div>
            <div>${(
              (receipt?.initialBalance || 0) + (receipt?.totalPrice || 0)
            ).toFixed(2)} ج.م</div>
          </div>
          <div class="summary-row">
            <div>المبلغ المدفوع:</div>
            <div>${(receipt?.moneyPaid || 0).toFixed(2)} ج.م</div>
          </div>
        </div>
      </div>
      <div class="net-total">
        الصافي: ${calculateNetBalance()} ج.م
      </div>
    `;

    // Check if weights table is needed
    const needsWeightsTable = Object.entries(receipt?.products || {}).some(
      ([productName, product]) =>
        !productDetails[productName]?.isStatic &&
        !allItemsHaveSameWeight(product.items),
    );

    // Generate weights table section
    const weightsTableSection = needsWeightsTable
      ? `
        <div class="weights-section">
          <table class="weights-table">
            ${generateWeightTables()}
          </table>
        </div>
      `
      : '';

    const generateProductRow = (product: SortedProduct) => `
      <tr>
        <td class="product-name-cell">${product.name}</td>
        <td>${(product.totalWeight || 0).toFixed(2)}</td>
        <td>${(product.sellPrice || 0).toFixed(2)}</td>
        <td>${calculateNumberOfItems(product.name, product)}</td>
        <td>${((product.totalWeight || 0) * (product.sellPrice || 0)).toFixed(
          2,
        )}</td>
      </tr>
    `;

    if (!needsSecondPage) {
      // Single page layout
      return `
        <!DOCTYPE html>
        <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${styleBlock}
          </head>
          <body>
            <div class="container">
              <div class="page">
                ${headerBlock}
                ${returnedStatusBlock}
                <table class="products-table">
                  ${tableHeaders}
                  <tbody>
                    ${products.map(generateProductRow).join('')}
                  </tbody>
                </table>
                ${summarySection}
                <div style="position: fixed;bottom: 5mm;"> 
                ${weightsTableSection}
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    // Split products into two pages
    const firstPageProducts = products.slice(0, PRODUCTS_PER_PAGE);
    const secondPageProducts = products.slice(PRODUCTS_PER_PAGE);

    // Two page layout - weights table only on the last page
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${styleBlock}
        </head>
        <body>
          <div class="container">
            <div class="page">
              ${headerBlock}
              ${returnedStatusBlock}
              <table class="products-table">
                ${tableHeaders}
                <tbody>
                  ${firstPageProducts.map(generateProductRow).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="page-break"></div>
            
            <div class="page">
              ${headerBlock}
              ${returnedStatusBlock}
              <table class="products-table">
                ${tableHeaders}
                <tbody>
                  ${secondPageProducts.map(generateProductRow).join('')}
                </tbody>
              </table>
              ${summarySection}
              ${weightsTableSection}
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePDF = async (detailed = false) => {
    try {
      const details = await fetchAllProductDetails();
      if (!details) {
        throw new Error('Failed to fetch product details');
      }
  
      const options = {
        html: generateDetailedReceiptHTML(details),
        fileName: `receipt_${clientName || 'unknown'}_${receipt?.Rnumber || 'unknown'}`,
        directory: 'Documents',
        width: detailed ? 148 : undefined,
        height: detailed ? 210 : undefined,
        base64: false,
      };
  
      const file = await RNHTMLtoPDF.convert(options);
  
      if (file.filePath) {
        console.log('PDF saved to:', file.filePath);
        
        // Explicitly set the MIME type when opening
        const fileOptions = {
          showOpenWithDialog: true,
          type: 'application/pdf'  // Explicitly set MIME type
        };
        
        // For Android, you might need to use content:// URI
        if (Platform.OS === 'android') {
          const fileUri = `file://${file.filePath}`;
          await FileViewer.open(fileUri, fileOptions);
        } else {
          await FileViewer.open(file.filePath, fileOptions);
        }
      } else {
        throw new Error('PDF file path is undefined');
      }
    } catch (error) {
      console.error('Error generating or opening PDF:', error);
      Alert.alert(
        'Error',
        `Failed to generate or open the PDF receipt: ${error}`,
      );
    }
  };

  const returnReceipt = async () => {
    try {
      if (!receipt || !receiptUuid || !db) {
        showMessage({
          message: "خطأ",
          description: "لا يمكن ارجاع الإيصال. البيانات غير مكتملة",
          type: "danger",
          duration: 3000,
          floating: true,
        });
        return;
      }
  
      setIsLoadin(true);
      await returnReceiptHelper(db, String(receiptUuid));
      
      onClose(); // Close modal first
      
      showMessage({
        message: "نجاح",
        description: "تم ارجاع الإيصال بنجاح",
        type: "success",
        duration: 3000,
        floating: true,
      });
      
    } catch (error) {
      onClose();
      console.error('Error returning receipt:', error);
      showMessage({
        message: "خطأ",
        description: "حدث خطأ أثناء ارجاع الإيصال",
        type: "danger",
        duration: 3000,
        floating: true,
      });
    } finally {
      setIsLoadin(false);
    }
  };
  
  const ConfirmationModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isConfirmationVisible}
      onRequestClose={() => setIsConfirmationVisible(false)}>
      <View style={styles.confirmationOverlay}>
        <View style={styles.confirmationModal}>
          <Text style={styles.confirmationTitle}>تأكيد الارجاع</Text>
          <Text style={styles.confirmationText}>
            هل أنت متأكد من أنك تريد ارجاع هذا الإيصال؟
          </Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.confirmButton]}
              onPress={() => {
                setIsConfirmationVisible(false);
                returnReceipt();
              }}>
              <Text style={styles.confirmationButtonText}>تأكيد</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.cancelButton]}
              onPress={() => setIsConfirmationVisible(false)}>
              <Text style={styles.confirmationButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  if (!receipt) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.title}>خطأ في تحميل الإيصال</Text>
            <Text style={styles.text}>لا يمكن العثور على تفاصيل الإيصال.</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { opacity: receipt?.status === 'returned' ? 0.9 : 1 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.title}>تفاصيل الإيصال</Text>

            <Text style={styles.text}>
              رقم العميل: {receipt.client || 'غير محدد'}
            </Text>
            <Text style={styles.text}>
              رقم الفاتورة: {receipt.Rnumber || 'غير محدد'}
            </Text>
            <Text style={styles.text}>
              تاريخ الإيصال:{' '}
              {receipt.createdAt
                ? new Date(receipt.createdAt).toLocaleDateString()
                : 'غير محدد'}
            </Text>

            <Text style={styles.subtitle}>المنتجات:</Text>

            {receipt.products && Object.entries(receipt.products).length > 0 ? (
              Object.entries(receipt.products)
              .sort(([_, a], [__, b]) => (a.Pnumber || 0) - (b.Pnumber || 0))
              .map(
                ([productName, product], index) => (
                  <View key={index} style={[styles.productCard, { opacity: receipt?.status === 'returned' ? 0.8 : 1 }]}>
                    <TouchableOpacity
                      onPress={() => toggleProductExpansion(productName)}>
                      <View style={styles.productHeader}>
                        <Text style={styles.productDetail}>
                          الوزن: {product.totalWeight?.toFixed(2) ?? 'غير محدد'}{' '}
                          كجم
                        </Text>
                        <Text style={styles.productName}>{productName}</Text>
                      </View>
                      <View style={styles.productDetails}>
                        <Text style={styles.productTotal}>
                          {calculateTotal(product)} ج.م
                        </Text>
                        <Text style={styles.productDetail}>
                          السعر: {product.sellPrice} ج.م/كجم
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {expandedProducts[productName] && product.items && (
                      <View style={styles.itemsContainer}>
                        {Object.entries(product.items)
                          .sort(([idA], [idB]) => {
                            const orderA =
                              productDetails[productName]?.items[idA]?.order ||
                              0;
                            const orderB =
                              productDetails[productName]?.items[idB]?.order ||
                              0;
                            return orderA - orderB;
                          })
                          .reduce((rows, [itemId, weight], index) => {
                            if (index % 2 === 0) rows.push([]);
                            rows[rows.length - 1].push(
                              <Text key={itemId} style={styles.itemText}>
                                القطعة {getArabicOrdinal(index + 1)} : {weight}{' '}
                                كجم
                              </Text>,
                            );
                            return rows;
                          }, [] as React.ReactNode[][])
                          .map((row, rowIndex) => (
                            <View key={rowIndex} style={styles.itemRow}>
                              {row}
                            </View>
                          ))}
                      </View>
                    )}
                  </View>
                ),
              )
            ) : (
              <Text style={styles.noProductsText}>
                لا توجد منتجات لهذا الإيصال
              </Text>
            )}

            <View style={styles.summary}>
              <Text style={styles.summaryText}>ملخص الحساب:</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>
                  {receipt.initialBalance || 0} ج.م
                </Text>
                <Text style={styles.summaryLabel}>الرصيد السابق:</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>
                  {receipt.totalPrice || 0} ج.م
                </Text>
                <Text style={styles.summaryLabel}>إجمالي تكلفة المنتجات:</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryValue}>
                  {receipt.moneyPaid || 0} ج.م
                </Text>
                <Text style={styles.summaryLabel}>المبلغ المدفوع:</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryValue, styles.netBalance]}>
                  {calculateNetBalance()} ج.م
                </Text>
                <Text style={styles.summaryLabel}>الصافي:</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
  <View style={styles.iconButtonsRow}>
    <TouchableOpacity
      style={styles.iconButton}
      onPress={() => handleGeneratePDF(true)}>
      <Icon name="file-pdf-box" size={24} color="white" />
      <Text style={styles.iconButtonText}>PDF</Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.iconButton}
      onPress={handleGenerateImage}>
      <Icon name="image" size={24} color="white" />
      <Text style={styles.iconButtonText}>صورة</Text>
    </TouchableOpacity>
  </View>
  
  <TouchableOpacity
    style={[
      styles.returnButton,
      receipt.status === 'returned' && styles.disabledButton
    ]}
    disabled={receipt.status === 'returned'}
    onPress={() => {
      logReceiptDetails(receipt);
      setIsConfirmationVisible(true);
    }}>
    <Text style={styles.buttonText}>
      {receipt.status === 'returned' ? 'تم الارجاع' : 'ارجاع الإيصال'}
    </Text>
  </TouchableOpacity>
</View>

            {receipt.status === 'returned' && (
              <View style={styles.returnedBanner}>
                <Text style={styles.returnedText}>
                  تم ارجاع هذا الإيصال بتاريخ {new Date(receipt.returnedAt || '').toLocaleDateString('ar-EG')}
                </Text>
              </View>
            )}
          </ScrollView>
          <ConfirmationModal />
        </View>
      </View>
      <View ref={viewRef} style={{ height: 0, overflow: 'hidden' }}>
  <WebView
    ref={webViewRef}
    source={{ html: htmlContent }}
    style={{ width: 800, height: 1200 }} // Adjust size as needed
    scrollEnabled={false}
    bounces={false}
    onLoad={handleWebViewLoad}
    javaScriptEnabled={true}
    domStorageEnabled={true}
  />
</View>
<View style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0 }}>
  <View ref={contentRef} style={{ 
    width: 400 , // Reduced from 800
    backgroundColor: 'white', 
    padding: 10, // Reduced padding 
  }}>
    <WebView
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      style={{ 
        width: 400, // Reduced from 800
        height: 600 , // Reduced from 1200
      }}
      scrollEnabled={false}
      onLoad={() => setIsWebViewReady(true)}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  </View>
</View>

    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  noProductsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productDetail: {
    fontSize: 14,
    color: '#666',
  },
  summary: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  netBalance: {
    color: '#4CAF50',
  },
  printButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  returnButton: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
  },
  confirmationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#dc3545',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  confirmationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#6c757d',  // Grey color
    opacity: 0.7,
  },
  
  returnedBanner: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  
  returnedText: {
    color: '#dc3545',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
iconButtonsRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 20,
  marginTop: 20,
},
iconButton: {
  backgroundColor: '#2196F3',
  borderRadius: 10,
  padding: 15,
  alignItems: 'center',
  minWidth: 80,
  flexDirection: 'column',
},
iconButtonText: {
  color: 'white',
  fontSize: 12,
  marginTop: 5,
  fontWeight: 'bold',
},
// Add to the styles object
viewContainer: {
  position: 'absolute',
  top: -9999,
  left: -9999,
  width: 800,
  height: 1200,
},
hiddenWebView: {
  opacity: 0,
  width: 800,
  height: 1200,
  backgroundColor: 'white',
},
hiddenContainer: {
  position: 'absolute',
  top: -9999,
  left: -9999,
  opacity: 0,
},
contentContainer: {
  width: 800,
  backgroundColor: 'white',
  padding: 20,
},
webviewStyle: {
  width: 800,
  height: 1200,
  backgroundColor: 'white',
},
});

export default ReceiptDetails;
