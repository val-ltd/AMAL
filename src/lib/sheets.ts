

'use server';

import { google } from 'googleapis';
import type { BudgetRequest, FundAccount, User } from './types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';


const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_NAME = 'request';


function getGoogleAuth() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'The GOOGLE_SERVICE_ACCOUNT_JSON environment variable was not found. Please set it to the contents of your service account JSON file.'
    );
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);
    return new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });
  } catch (e: any) {
     console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", e.message);
     throw new Error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON. Make sure it's a valid JSON string.");
  }
}

const getSheetsApi = () => {
    const auth = getGoogleAuth();
    return google.sheets({ version: 'v4', auth });
}

const ensureSheetExists = async (sheets: any, spreadsheetId: string) => {
    const response = await sheets.spreadsheets.get({
        spreadsheetId,
    });
    const sheetExists = response.data.sheets.some(
        (sheet: any) => sheet.properties.title === SHEET_NAME
    );

    if (!sheetExists) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: SHEET_NAME,
                            },
                        },
                    },
                ],
            },
        });
    }
};


const ensureHeaderRow = async (sheets: any, sheetId: string) => {
    const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${SHEET_NAME}!A1:Z1`,
    });
    
    const expectedHeaders = [
        'ID',
        'Created At',
        'Lembaga',
        'Divisi',
        'Requester',
        'Nama Pemohon',
        'No. HP',
        'Email',
        'Supervisor',
        'Perihal Memo',
        'Periode',
        'Status',
        'Amount',
        'Uraian',
        'Qty',
        'Unit',
        'Harga Satuan',
        'Total',
        'Category',
        'Rek Penerima',
        'Nama Rek Penerima',
        'Bank Penerima',
        'Biaya Trf',
        'Rek Pengirim',
        'Nama Rek Pengirim',
        'Bank Pengirim'
    ];

    if (!getResponse.data.values || getResponse.data.values.length === 0 || JSON.stringify(getResponse.data.values[0]) !== JSON.stringify(expectedHeaders)) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [expectedHeaders],
            },
        });
    }
};

interface FullRequestForSheet extends BudgetRequest {
    requesterProfile: User;
    fundAccount: FundAccount;
}

export async function appendRequestToSheet(request: FullRequestForSheet): Promise<{startRow: number, endRow: number}> {
  try {
    const sheets = getSheetsApi();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      throw new Error('Missing GOOGLE_SHEET_ID env var.');
    }
    
    await ensureSheetExists(sheets, sheetId);
    await ensureHeaderRow(sheets, sheetId);

    const range = `${SHEET_NAME}!A1`;
    
    const itemRows = request.items.map(item => [
        request.id, // ID
        format(new Date(request.createdAt), "yyyy-MM-dd HH:mm:ss"), // Created At
        request.department?.lembaga ?? request.institution ?? '', // Lembaga
        request.department?.divisi ?? request.division ?? '', // Divisi
        request.requester.name, // Requester
        request.requesterProfile.name, // Nama pemohon
        request.requesterProfile.phoneNumber ?? '', // No. HP
        request.requesterProfile.email ?? '', // Email
        request.supervisor?.name ?? 'N/A', // Supervisor
        request.subject, // Perihal Memo
        request.budgetPeriod, // Periode
        request.status, // Status
        request.amount, // Amount (Total request amount)
        item.description, // Uraian
        item.qty, // Qty
        item.unit, // Unit
        item.price, // Harga Satuan
        item.total, // Total (Item total)
        item.category, // Category
        request.reimbursementAccount?.accountNumber ?? 'N/A', // Rek Penerima
        request.reimbursementAccount?.accountHolderName ?? 'N/A', // Nama rek penerima
        request.reimbursementAccount?.bankName ?? 'N/A', // Bank penerima
        request.transferFee ?? 0, // Biaya Trf
        request.fundAccount.accountNumber, // Rek Pengirim
        request.fundAccount.accountName, // Nama Rek pengirim
        request.fundAccount.bankName, // Bank Pengirim
    ]);


    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: itemRows,
      },
    });

    const updatedRange = response.data.updates?.updatedRange;
    if (updatedRange) {
        // Example updatedRange: 'request!A10:W11'
        const match = updatedRange.match(/!A(\d+):/);
        if (match) {
            const startRow = parseInt(match[1], 10);
            const endRow = startRow + itemRows.length - 1;
            return { startRow, endRow };
        }
    }

    // Fallback if range parsing fails, though it shouldn't.
    throw new Error("Could not determine the updated row range from Google Sheets response.");

  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    // Re-throw the error so the calling function knows about it
    throw error;
  }
}

export async function updateRequestInSheet(status: BudgetRequest['status'], startRow: number, endRow: number) {
    try {
        const sheets = getSheetsApi();
        const sheetId = process.env.GOOGLE_SHEET_ID;
        if (!sheetId) {
          console.log('Missing GOOGLE_SHEET_ID env var, skipping sheet update.');
          return;
        }

        if (!startRow || !endRow) {
            console.error(`Cannot update sheet: missing sheet row numbers.`);
            return;
        }
        
        // Status is in column L (12th column)
        const rangeToUpdate = `${SHEET_NAME}!L${startRow}:L${endRow}`;

        const values = Array(endRow - startRow + 1).fill([status]);

        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: rangeToUpdate,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });
        

    } catch (error) {
        console.error('Error updating Google Sheet:', error);
        // Re-throw the error so the calling function knows about it
        throw error;
    }
}
