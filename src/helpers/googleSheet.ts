import { sheets } from "../config/sheet";

interface GetSheetDataProps {
  range: string;
}

export const getSheetData = async ({
  range,
}: GetSheetDataProps): Promise<any[][] | null | undefined> => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range,
    });
    return response.data.values;
  } catch (error) {
    console.error("Error retrieving data from the sheet:", error);
    throw error;
  }
};

interface UpdateSheetDataProps {
  range: string;
  inputOption: string;
  values: any[][];
}

export const updateSheetData = async ({
  range,
  inputOption,
  values,
}: UpdateSheetDataProps): Promise<void> => {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range,
      valueInputOption: inputOption,
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error("Error updating data in the sheet:", error);
    throw error;
  }
};
