import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { Receipt, ReceiptProduct } from '../utils/types';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';

interface ReceiptDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  receipt: Receipt | undefined;
  receiptUuid: String | null ;
  clientName:String | null ;
}

const ReceiptDetails: React.FC<ReceiptDetailsProps> = ({
  isVisible,
  onClose,
  receipt,
  receiptUuid,
  clientName
}) => {
  const [expandedProducts, setExpandedProducts] = useState<{
    [key: string]: boolean;
  }>({});

  const convertToLbs = (kg: number) => (kg / 0.455).toFixed(2);

  const calculateTotal = (product: ReceiptProduct) => {
    if (!product) return 0;
    return ((product.totalWeight || 0) * (product.sellPrice || 0)).toFixed(2);
  };

  const calculateNetBalance = () => {
    if (!receipt) return 0;
    return ((receipt.initialBalance || 0) + (receipt.totalPrice || 0) - (receipt.moneyPaid || 0)).toFixed(2);
  };

  const toggleProductExpansion = (productName: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productName]: !prev[productName],
    }));
  };

  const getArabicOrdinal = (number: number) => {
    const ordinals = [
      'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 
      'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'
    ];
    return ordinals[number - 1] || number.toString();
  };

  const allItemsHaveSameWeight = (items: Record<string, number>): boolean => {
    const weights = Object.values(items);
    return weights.every(weight => weight === weights[0]);
  };

  const generateWeightTables = () => {
    if (!receipt?.products) return '';
    
    const MAX_ITEMS_PER_COLUMN = 5;
    const MAX_COLUMNS = 5;
    
    const generateProductColumns = (items: Record<string, number>) => {
      // Skip generating columns if all items have same weight
      if (allItemsHaveSameWeight(items)) {
        return [];
      }

      const columns = [];
      const weights = Object.values(items || {});
      
      for (let i = 0; i < weights.length; i += MAX_ITEMS_PER_COLUMN) {
        const columnWeights = weights.slice(i, i + MAX_ITEMS_PER_COLUMN);
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
      const productColumns = generateProductColumns(product.items);
      
      productColumns.forEach((column, index) => {
        if (remainingColumns > 0) {
          allColumns.push({
            name: index === 0 ? productName : `${productName} (تابع)`,
            weights: column,
            total: index === productColumns.length - 1 ? product.totalWeight : null
          });
          remainingColumns--;
        }
      });
    });
  
    while (remainingColumns > 0) {
      allColumns.push({
        name: '-',
        weights: Array(MAX_ITEMS_PER_COLUMN).fill(0),
        total: null
      });
      remainingColumns--;
    }
  
    const rows = [];
    rows.push(`<tr>${allColumns.map(col => 
      `<th class="product-header">${col.name}</th>`
    ).join('')}</tr>`);
  
    for (let i = 0; i < MAX_ITEMS_PER_COLUMN; i++) {
      rows.push(`<tr>${allColumns.map(col => 
        `<td class="weight-cell">${col.weights[i] ? convertToLbs(col.weights[i]) : '-'}</td>`
      ).join('')}</tr>`);
    }
  
    rows.push(`<tr>${allColumns.map(col => 
      `<td class="total-weight">${col.total ? convertToLbs(col.total) : '-'}</td>`
    ).join('')}</tr>`);
  
    return `
    <div style="position: fixed; bottom: 5mm; left: 10mm; right: 10mm; width: calc(100% - 20mm);">
        <table class="weights-table">
          ${rows.join('')}
        </table>
      </div>
    `;
  };
  
  const generateProductsTable = () => {
    if (!receipt?.products) return '';
    
    const productRows = Object.entries(receipt.products).map(([productName, product]) => {
      const total = ((product.totalWeight || 0) * (product.sellPrice || 0)).toFixed(2);
      const itemCount = Object.keys(product.items || {}).length;
      const allSameWeight = allItemsHaveSameWeight(product.items);
      const singleWeight = allSameWeight ? Object.values(product.items)[0] : null;

      return `
        <tr>
          <td class="product-name-cell">${productName}</td>
          <td>${product.totalWeight?.toFixed(2)}</td>
          <td>${product.sellPrice}</td>
          <td>${itemCount} </td>
          <td>${total}</td>
        </tr>
      `;
    }).join('');

    // Updated table structure
    return `
      <table class="products-table">
        <thead>
          <tr>
            <th class="product-name-header">المنتج</th>
            <th>الوزن الكلي</th>
            <th>السعر/كجم</th>
            <th> العدد</th>
            <th>السعر الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
    `; 
  };
  
  const generateDetailedReceiptHTML = () => {
    const extractionDate = new Date().toLocaleDateString('ar-EG');
    const receiptDate = receipt?.createdAt ? new Date(receipt.createdAt).toLocaleDateString('ar-EG') : 'غير محدد';
  
    return `
      <html dir="rtl">
        <head>
          <style>
          @page { 
            size: A5 portrait;
            margin: 10mm; /* Increased margin to prevent cutoff */
          }
          body {
            font-family: 'Cairo', Arial, sans-serif;
            margin: 0;
            padding: 8px;
            font-size: 12px; /* Increased from 10px */
            background-color: white;
            width: 133mm; /* Adjusted to account for margins */
            height: 190mm; /* Reduced height to prevent second page */
            overflow: hidden;
            box-sizing: border-box;
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
            font-size: 14px; /* Increased from 12px */
            color: #333;
            margin-left: 15px; /* Added margin to prevent cutoff */
          }
          .logo {
            width: 60px;
            height: 60px;
          }
          .company-name {
            font-size: 14px; /* Increased from 12px */
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
            font-size: 12px; /* Increased from 10px */
          }
          .info-label {
            color: #2c3e50;
            font-weight: bold;
          }
          .products-table {
            width: calc(100% - 10px); /* Adjusted width */
            margin: 10px 5px;
            border-collapse: collapse;
            font-size: 11px; /* Increased from 9px */
          }
          .products-table th, .products-table td {
            padding: 8px 6px; /* Increased padding */
            text-align: center;
            border: 1px solid #dee2e6;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            height: 24px;  /* Added explicit height */
            line-height: 1.2;  /* Added line height for better text positioning */
          }
          .product-name-header, .product-name-cell {
            max-width: 100px; /* Increased from 80px */
            width: 100px;
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
            font-size: 18px; /* Increased from 16px */
            font-weight: bold;
            margin: 10px auto;
            padding: 8px;
            background-color: #2c3e50;
            color: white;
            border-radius: 4px;
            width: fit-content;
          }
          .weights-section {
            margin: 10px 5px;
            width: calc(100% - 10px); /* Adjusted width */
          }
          .weights-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #dee2e6;
            font-size: 10px; /* Increased from 8px */
            table-layout: fixed;
            margin-bottom: 0;  /* Remove bottom margin */
            background-color: white;  /* Ensure table is visible over other content */
          }
          .weights-table th, .weights-table td {
            border: 1px solid #dee2e6;
            text-align: center;
            padding: 1px;
            width: 12.5%; /* Fixed width for each column (100% / 8 columns) */
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .product-header {
            background-color: #e9ecef;
            color: black;
            text-align: center;
            font-weight: bold;
            font-size: 10px; /* Increased from 8px */
            height: 20px; /* Increased from 16px */
          }
          .weight-cell {
            text-align: center;
            height: 12px; /* Increased from 10px */
            font-size: 10px; /* Increased from 8px */
          }
          .total-weight {
            text-align: center;
            font-weight: bold;
            background-color: #e9ecef;
            font-size: 8px;
          }
          /* Add styles for the single weight display */
          .single-weight-note {
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            margin-top: 8px;
            color: #333;
          }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-right">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAIAAABoJHXvAAAAw3pUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHjabVDbDcMgDPxnio4AtgNmHPKo1A06fg9soiTqST4/dRiH4/t5h1cHJQmyFM015whIlUoNgUZDG5yiDB6o3kJ+q4ezQSgxPFuq2ednPZ0C5hqi5SKkmzfWe6OK6+tDiMxx36jH+9zIhZiskVyg2bdirlquX1iPeIeahU60+ZgPP3MpuN6+4B0mOjhxBDOrLcDdJHBDUMGJCwbBoyJg4imGg/y700T4ARncWXVtpuiZAAABhWlDQ1BJQ0MgcHJvZmlsZQAAeJx9kTtIw0Acxr8+pD6qInYQcchQneyiIo6likWwUNoKrTqYXPqCJg1Jiouj4Fpw8LFYdXBx1tXBVRAEHyDODk6KLlLi/5JCixgPjvvx3X0fd98B3kaFKYY/CiiqqafiMSGbWxUCr+jBEAbgR5/IDC2RXszAdXzdw8PXuwjPcj/35+iX8wYDPAJxlGm6SbxBPLtpapz3iUOsJMrE58STOl2Q+JHrksNvnIs2e3lmSM+k5olDxEKxg6UOZiVdIZ4hDsuKSvnerMMy5y3OSqXGWvfkLwzm1ZU012mOIY4lJJCEAAk1lFGBiQitKikGUrQfc/GP2v4kuSRylcHIsYAqFIi2H/wPfndrFKannKRgDOh6sayPcSCwCzTrlvV9bFnNE8D3DFypbX+1Acx9kl5va+EjYHAbuLhua9IecLkDjDxpoi7ako+mt1AA3s/om3LA8C3Qu+b01trH6QOQoa6Wb4CDQ2CiSNnrLu/u7uzt3zOt/n4AR4Vylfq4BAUAAA12aVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA0LjQuMC1FeGl2MiI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpHSU1QPSJodHRwOi8vd3d3LmdpbXAub3JnL3htcC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjZjN2M5MzY4LTEwMGUtNGRhZS05ZDVjLTgwODAxZDY3ZjMyNyIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDplY2EyYjM1Yi1kZmU4LTQ0ODYtYmI2MC00YjU2YTFkMjZiMTYiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpkZDFjMGNmYy03NDFhLTQyOGUtOGIzZC04ZTZjNjljYjliMWYiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJXaW5kb3dzIgogICBHSU1QOlRpbWVTdGFtcD0iMTcyNjU4MTg2MTgzNTQ3MCIKICAgR0lNUDpWZXJzaW9uPSIyLjEwLjM4IgogICB0aWZmOk9yaWVudGF0aW9uPSIxIgogICB4bXA6Q3JlYXRvclRvb2w9IkdJTVAgMi4xMCIKICAgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNDowOToxN1QxNzowNDoyMCswMzowMCIKICAgeG1wOk1vZGlmeURhdGU9IjIwMjQ6MDk6MTdUMTc6MDQ6MjArMDM6MDAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphOWQ1ZjczYy04MjVjLTRkOTItYWIzZC1iNmQ4ZWZkZTQyNzMiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjQtMDktMTdUMTc6MDQ6MjEiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+ImWArwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+gJEQ4EFdBZbSEAACAASURBVHja3L15vOVXUS9atdb6jXve+8xTn9Pz3EmnkyaAiQkkQEAGBX3IuyLidZZ3vVe8ilz0XXzo8woOF0QcEFERJSFBDUgwQCAJEDJ1hh6SnrtPn3HPv/0b11r1/ljn7D49JIQkop+3/ujPPrv33r+hVlV9q+pb9cMoiuDFW0SEiGvfQUTzJhFd+v7aFwAaUDPInX7wPXLuszT8I9N738M5KpKIfPV7DEATETBEuvwRn9vSAKz/mjFBhESKiBhjF53qpevSy/meLfbi/lz/3vVfmAu7zOXpFSER9W+3IBAEaRq0HOHY83fNPfkJZjkXSkOjWUZawL4raTHGVr5+fgeA1joMwyxLiIhz/iz35KKL+v+DwC5StbV386KLXBWT0Ri1sus1gXCc0nSmuXDzcvb2haNfEXYOVj4AaNRr9RcQ9BqNeUY9MCcjpWw2m0mSJEmSpqmRH2OMMZEkSa/X63a77XZb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" class="logo" />
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
                <span class="info-value">${receiptUuid || 'غير محدد'}</span>
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
  
          ${generateProductsTable()}
  
          <div class="summary-container">
            <div class="summary-group">
              <div class="summary-row">
                <div>الرصيد السابق:</div>
                <div>${receipt?.initialBalance || 0} ج.م</div>
              </div>
              <div class="summary-row">
                <div>تكلفة المنتجات:</div>
                <div>${receipt?.totalPrice || 0} ج.م</div>
              </div>
            </div>
            <div class="summary-group">
              <div class="summary-row">
                <div>الإجمالي:</div>
                <div>${(receipt?.initialBalance || 0) + (receipt?.totalPrice || 0)} ج.م</div>
              </div>
              <div class="summary-row">
                <div>المبلغ المدفوع:</div>
                <div>${receipt?.moneyPaid || 0} ج.م</div>
              </div>
            </div>
          </div>
  
          <div class="net-total">
            الصافي: ${calculateNetBalance()} ج.م
          </div>
  
          ${Object.entries(receipt?.products || {}).some(([_, product]) => 
            !allItemsHaveSameWeight(product.items)
          ) ? generateWeightTables() : ''}
        </body>
      </html>
    `;
  };



  // Simple PDF HTML template
  const generateSimpleReceiptHTML = () => {
    const productRows = receipt?.products
      ? Object.entries(receipt.products)
          .map(([productName, product]) => `
            <div class="product-card">
              <div class="product-header">
                <span class="product-weight">الوزن: ${product.totalWeight ?? 'غير محدد'} كجم</span>
                <span class="product-name">${productName}</span>
              </div>
              <div class="product-details">
                <span class="product-total">${calculateTotal(product)} ج.م</span>
                <span class="product-price">السعر: ${product.sellPrice} ج.م/كجم</span>
              </div>
              <div class="items-container">
                ${Object.entries(product.items || {})
                  .reduce((rows, [itemId, weight], index) => {
                    if (index % 2 === 0) rows.push([]);
                    rows[rows.length - 1].push(`
                      <div class="item-text">القطعة ${getArabicOrdinal(index + 1)}  :  ${weight} كجم</div>
                    `);
                    return rows;
                  }, [] as string[][])
                  .map(row => `<div class="item-row">${row.join('')}</div>`)
                  .join('')}
              </div>
            </div>
          `)
          .join('')
      : '';

    return `
      <html dir="rtl">
        <head>
          <!-- Styles omitted as requested -->
        </head>
        <body>
          <h1 class="title">تفاصيل الإيصال</h1>
          
          <p class="text">رقم العميل: ${receipt?.client || 'غير محدد'}</p>
          <p class="text">الرصيد السابق: ${receipt?.initialBalance || 0} ج.م</p>
  
          <h2 class="subtitle">المنتجات:</h2>
  
          ${productRows || '<p>لا توجد منتجات لهذا الإيصال</p>'}
  
          <div class="summary">
            <p class="summary-text">ملخص الحساب:</p>
            <div class="summary-row">
              <span class="summary-label">الرصيد السابق:</span>
              <span class="summary-value">${receipt?.initialBalance || 0} ج.م</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">إجمالي تكلفة المنتجات:</span>
              <span class="summary-value">${receipt?.totalPrice || 0} ج.م</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">المبلغ المدفوع:</span>
              <span class="summary-value">${receipt?.moneyPaid || 0} ج.م</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">الصافي:</span>
              <span class="summary-value net-balance">${calculateNetBalance()} ج.م</span>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePDF = async (detailed: boolean = false) => {
    try {
      if (typeof RNHTMLtoPDF.convert !== 'function') {
        throw new Error('RNHTMLtoPDF.convert is not a function');
      }

      const options = {
        html: detailed ? generateDetailedReceiptHTML() : generateSimpleReceiptHTML(),
        fileName: `receipt_${receipt?.client || 'unknown'}`,
        directory: 'Documents',
        width: detailed ? 148 : undefined, // A5 width in mm for detailed version
        height: detailed ? 210 : undefined, // A5 height in mm for detailed version
      };

      const file = await RNHTMLtoPDF.convert(options);

      if (file.filePath) {
        console.log('PDF saved to:', file.filePath);
        await FileViewer.open(file.filePath, { showOpenWithDialog: true });
      } else {
        throw new Error('PDF file path is undefined');
      }
    } catch (error) {
      console.error('Error generating or opening PDF:', error);
      Alert.alert('Error', `Failed to generate or open the PDF receipt: ${error}`);
    }
  };

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
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.title}>تفاصيل الإيصال</Text>

            <Text style={styles.text}>رقم العميل: {receipt.client || 'غير محدد'}</Text>
            <Text style={styles.text}>
              تاريخ الإيصال : {receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString() : 'غير محدد'}
            </Text>

            <Text style={styles.subtitle}>المنتجات:</Text>

            {receipt.products &&
            Object.entries(receipt.products).length > 0 ? (
              Object.entries(receipt.products).map(
                ([productName, product], index) => (
                  <View key={index} style={styles.productCard}>
                    <TouchableOpacity
                      onPress={() => toggleProductExpansion(productName)}>
                      <View style={styles.productHeader}>
                        <Text style={styles.productDetail}>
                          الوزن: {product.totalWeight?.toFixed(2) ?? 'غير محدد'} كجم
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
                          .reduce((rows, [itemId, weight], index) => {
                            if (index % 2 === 0) rows.push([]);
                            rows[rows.length - 1].push(
                              <Text key={itemId} style={styles.itemText}>
                                القطعة {getArabicOrdinal(index + 1)} : {weight} كجم
                              </Text>
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
              {/* <TouchableOpacity
                style={styles.printButton}
                onPress={() => handleGeneratePDF(false)}>
                <Text style={styles.buttonText}>طباعة إيصال بسيط</Text>
              </TouchableOpacity> */}
              
              <TouchableOpacity
                style={styles.printButton}
                onPress={() => handleGeneratePDF(true)}>
                <Text style={styles.buttonText}>طباعة إيصال </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonContainer:{
    width:"100%",
    display :'flex',
    flexDirection:'column'
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
    flexDirection: 'row-reverse',
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
});

export default ReceiptDetails;
